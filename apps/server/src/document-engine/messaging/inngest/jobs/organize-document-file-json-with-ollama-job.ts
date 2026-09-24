import { Inject, Injectable, Logger } from '@nestjs/common'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import { DocumentFileJsonOrganizationRequestedEvent } from '@hms/core/document-engine/domain/events'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import { eventType, type InngestFunction } from 'inngest'

import { DocumentJsonOrganizerAgent } from '@/document-engine/ai/mastra/agents'
import { buildDocumentJsonOrganizationPrompt } from '@/document-engine/ai/mastra/prompts'
import { documentJsonOrganizationSchema } from '@/document-engine/ai/mastra/schemas'
import type { DocumentJsonOrganization } from '@/document-engine/ai/mastra/schemas'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { documentFileJsonOrganizationRequestedSchema } from '@/document-engine/messaging/inngest/schemas'
import type { DocumentJsonOrganizationResult } from '@/document-engine/messaging/inngest/structures'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const documentFileJsonOrganizationRequested = eventType(
  DocumentFileJsonOrganizationRequestedEvent._NAME,
  { schema: documentFileJsonOrganizationRequestedSchema },
)

@Injectable()
export class OrganizeDocumentFileJsonWithOllamaJob extends InngestJob {
  static readonly ID = 'document-engine/organize-document-file-json-with-ollama'
  readonly function: InngestFunction.Like
  private readonly logger = new Logger(OrganizeDocumentFileJsonWithOllamaJob.name)

  constructor(
    inngest: InngestClient,
    private readonly documentJsonOrganizerAgent: DocumentJsonOrganizerAgent,
    @Inject(DOCUMENT_ENGINE.documentValidations)
    private readonly validationsRepository: DocumentValidationsRepository,
  ) {
    super(inngest)

    this.function = this.inngest.createFunction(
      {
        id: OrganizeDocumentFileJsonWithOllamaJob.ID,
        name: 'Organize Document File JSON With Ollama',
        triggers: [documentFileJsonOrganizationRequested],
      },
      async ({ event, step }) => {
        const currentDocument = await step.run(
          'load-document-file-current-analysis',
          async () => this.validationsRepository.findByFileId(event.data.documentFileId),
        )

        if (
          !currentDocument ||
          currentDocument.status === DocumentValidationStatus.Duplicate ||
          currentDocument.duplicateMatch
        ) {
          return { skipped: true, reason: 'duplicate_or_missing_document' }
        }

        const extractedTextFull =
          event.data.extractedTextFull ??
          this.getExtractedTextFull(currentDocument.aiSuggestion)

        if (!this.hasReadableText(extractedTextFull)) {
          return {
            skipped: true,
            reason: 'missing_extracted_text',
            documentFileId: event.data.documentFileId,
          }
        }

        const ollamaResult = await step.run(
          'generate-document-json-with-ollama',
          async () =>
            this.generateSuggestion({
              documentFileId: event.data.documentFileId,
              extractedTextFull,
            }),
        )

        if (!ollamaResult.captured) {
          return step.run('record-document-json-organization-failure', async () =>
            this.recordProcessingFailure({
              documentFileId: event.data.documentFileId,
              hashSha256: event.data.hashSha256,
              reason: ollamaResult.reason,
              fallbackSuggestion: currentDocument.aiSuggestion,
              fallbackExtractedFields: currentDocument.extractedFields,
              fallbackMissingFields: currentDocument.missingFields,
              metadata: {
                mimeType: event.data.mimeType,
                sizeBytes: event.data.sizeBytes,
                hashSha256: event.data.hashSha256,
                textLength: extractedTextFull.length,
                extractedTextFull,
              },
            }),
          )
        }

        return step.run('record-document-json-organization', async () => {
          const latestDocument = await this.validationsRepository.findByFileId(
            event.data.documentFileId,
          )

          if (!latestDocument || this.shouldSkipSuccessfulOrganization(latestDocument)) {
            return {
              skipped: true,
              reason: 'analysis_already_completed',
              documentFileId: event.data.documentFileId,
            }
          }

          const { suggestion } = ollamaResult
          const hasVerifiedFields = suggestion.extractedFields.length > 0
          const status = latestDocument.checklistLink?.checklistItemId
            ? DocumentValidationStatus.AwaitingValidation
            : DocumentValidationStatus.NotLinked

          await this.validationsRepository.recordAnalysis({
            documentFileId: event.data.documentFileId,
            status,
            hashSha256: event.data.hashSha256,
            aiConfidence: Math.round(suggestion.confidence * 100),
            extractedFields: suggestion.extractedFields.map((field) => ({
              ...field,
              isMissing: false,
            })),
            missingFields: [],
            caseId: latestDocument.checklistLink?.caseId,
            checklistItemId: latestDocument.checklistLink?.checklistItemId,
            aiSuggestion: {
              ...this.getPreservedSuggestionContext(latestDocument.aiSuggestion),
              suggestedStatus: status,
              confidenceLabel: hasVerifiedFields
                ? 'Organizado pelo Ollama — confira os campos'
                : 'Campos não confirmados — revisão manual',
              evidence: suggestion.evidence,
              metadata: {
                mimeType: event.data.mimeType,
                sizeBytes: event.data.sizeBytes,
                hashSha256: event.data.hashSha256,
                textLength: extractedTextFull.length,
                extractedTextFull,
              },
              ollamaJsonOrganizationCaptured: hasVerifiedFields,
            },
          })

          return hasVerifiedFields
            ? { skipped: false, documentFileId: event.data.documentFileId }
            : {
                skipped: true,
                reason: 'no_source_verified_fields',
                documentFileId: event.data.documentFileId,
              }
        })
      },
    )
  }

  private async generateSuggestion(input: {
    documentFileId: string
    extractedTextFull: string
  }): Promise<DocumentJsonOrganizationResult> {
    const startedAt = Date.now()

    try {
      const response = await this.documentJsonOrganizerAgent.generate([
        {
          role: 'user',
          content: buildDocumentJsonOrganizationPrompt(input.extractedTextFull),
        },
      ])
      const text = response.text

      if (typeof text !== 'string' || text.trim().length === 0) {
        return { captured: false, reason: 'ollama_empty_response' }
      }

      const suggestion = documentJsonOrganizationSchema.parse(
        JSON.parse(this.extractJson(text)),
      )
      const verifiedSuggestion = this.keepSourceVerifiedFields(
        suggestion,
        input.extractedTextFull,
      )

      this.logger.log(
        JSON.stringify({
          event: 'document_json_organization_completed',
          documentFileId: input.documentFileId,
          durationMs: Date.now() - startedAt,
          inputTextLength: input.extractedTextFull.length,
          returnedFieldsCount: suggestion.extractedFields.length,
          verifiedFieldsCount: verifiedSuggestion.extractedFields.length,
        }),
      )

      return {
        captured: true,
        suggestion: verifiedSuggestion,
      }
    } catch (error) {
      const reason =
        error instanceof Error && error.message.trim().length > 0
          ? error.message.trim().slice(0, 180)
          : 'ollama_unknown_error'
      this.logger.warn(
        JSON.stringify({
          event: 'document_json_organization_failed',
          documentFileId: input.documentFileId,
          durationMs: Date.now() - startedAt,
          inputTextLength: input.extractedTextFull.length,
          reason,
        }),
      )

      return {
        captured: false,
        reason,
      }
    }
  }

  private async recordProcessingFailure(input: {
    documentFileId: string
    hashSha256: string
    reason: string
    fallbackSuggestion?: Record<string, unknown>
    fallbackExtractedFields: Record<string, unknown>[]
    fallbackMissingFields: string[]
    metadata: {
      mimeType: string
      sizeBytes: number
      hashSha256: string
      textLength: number
      extractedTextFull: string
    }
  }) {
    const latestDocument = await this.validationsRepository.findByFileId(
      input.documentFileId,
    )

    if (!latestDocument) {
      return {
        skipped: true,
        reason: 'missing_document_before_failure_record',
        documentFileId: input.documentFileId,
      }
    }

    if (this.shouldPreserveCurrentAnalysis(latestDocument)) {
      return {
        skipped: true,
        reason: 'analysis_already_completed',
        documentFileId: input.documentFileId,
      }
    }

    await this.validationsRepository.recordAnalysis({
      documentFileId: input.documentFileId,
      status: DocumentValidationStatus.ProcessingFailure,
      hashSha256: input.hashSha256,
      aiConfidence: 0,
      extractedFields:
        latestDocument.extractedFields.length > 0
          ? latestDocument.extractedFields
          : input.fallbackExtractedFields,
      missingFields:
        latestDocument.missingFields.length > 0
          ? latestDocument.missingFields
          : input.fallbackMissingFields,
      aiSuggestion: {
        ...this.getPreservedSuggestionContext(
          latestDocument.aiSuggestion ?? input.fallbackSuggestion,
        ),
        suggestedStatus: DocumentValidationStatus.ProcessingFailure,
        confidenceLabel: 'Falha no processamento automático',
        failureReason: this.getProcessingFailureReason(input.reason),
        failureInstruction:
          'Verifique se o modelo local do Ollama está disponível e tente processar o documento novamente.',
        metadata: input.metadata,
        ollamaJsonOrganizationCaptured: false,
      },
    })

    return {
      skipped: true,
      reason: input.reason,
      documentFileId: input.documentFileId,
    }
  }

  private getProcessingFailureReason(reason: string) {
    const normalizedReason = reason.trim()

    if (normalizedReason.length === 0) {
      return 'A IA retornou erro ao organizar os dados extraídos.'
    }

    return `A IA retornou erro ao organizar os dados extraídos: ${normalizedReason.slice(
      0,
      160,
    )}`
  }

  private extractJson(text: string) {
    const trimmed = text.trim()
    const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)

    if (fencedJson?.[1]) {
      return fencedJson[1].trim()
    }

    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')

    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1)
    }

    return trimmed
  }

  private getExtractedTextFull(aiSuggestion?: Record<string, unknown>) {
    const metadata = aiSuggestion?.metadata

    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return ''
    }

    const extractedTextFull = (metadata as Record<string, unknown>).extractedTextFull

    return typeof extractedTextFull === 'string' ? extractedTextFull : ''
  }

  private hasReadableText(text: string) {
    return /[\p{L}\p{N}]{2,}/u.test(text)
  }

  private keepSourceVerifiedFields(
    suggestion: DocumentJsonOrganization,
    extractedTextFull: string,
  ): DocumentJsonOrganization {
    const extractedFields = suggestion.extractedFields.filter((field) => {
      const evidence = suggestion.evidence.find(
        (candidate) =>
          this.normalizeFieldLabel(candidate.field) ===
            this.normalizeFieldLabel(field.label) &&
          extractedTextFull.includes(candidate.sourceText),
      )

      if (!evidence) {
        return false
      }

      if (this.hasEmbeddedFieldLabel(field.value, field.label)) {
        return false
      }

      const evidenceStart = extractedTextFull.indexOf(evidence.sourceText)
      const labelPattern = new RegExp(
        `^\\s*${this.escapeRegExp(field.label)}\\s*[:：]\\s*`,
        'i',
      )
      const labelMatch = labelPattern.exec(evidence.sourceText)

      if (!labelMatch || evidenceStart < 0) {
        return false
      }

      const valueStart = evidenceStart + labelMatch[0].length
      const nextLabel = this.findNextLabeledField(extractedTextFull, valueStart)
      const valueEnd = nextLabel?.index ?? extractedTextFull.length
      const sourceValue = extractedTextFull.slice(valueStart, valueEnd).trim()
      const citedValue = evidence.sourceText.slice(labelMatch[0].length).trim()

      return (
        this.normalizeFieldValue(sourceValue) === this.normalizeFieldValue(field.value) &&
        this.normalizeFieldValue(citedValue) === this.normalizeFieldValue(field.value)
      )
    })

    const verifiedLabels = new Set(
      extractedFields.map((field) => this.normalizeFieldLabel(field.label)),
    )
    const evidence = suggestion.evidence.filter((item) =>
      verifiedLabels.has(this.normalizeFieldLabel(item.field)),
    )
    const originalFieldCount = suggestion.extractedFields.length
    const verificationRatio =
      originalFieldCount === 0 ? 0 : extractedFields.length / originalFieldCount

    return {
      confidence: Math.min(suggestion.confidence, verificationRatio),
      extractedFields,
      evidence,
    }
  }

  private findNextLabeledField(text: string, startIndex: number) {
    const labelPattern = /[\p{L}][\p{L}\p{N} _/().-]{0,40}\s*[:：]/gu
    for (const match of text.slice(startIndex).matchAll(labelPattern)) {
      const relativeIndex = match.index

      if (relativeIndex !== undefined) {
        const absoluteIndex = startIndex + relativeIndex
        const precedingCharacter = text[absoluteIndex - 1]

        if (
          absoluteIndex === startIndex ||
          precedingCharacter === undefined ||
          /[\s,;|]/u.test(precedingCharacter)
        ) {
          return { index: absoluteIndex }
        }
      }
    }

    return undefined
  }

  private normalizeFieldLabel(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')
  }

  private hasEmbeddedFieldLabel(value: string, currentLabel: string) {
    const fieldLabels =
      /\b(?:cliente|cpf\/cnpj|cpf|cnpj|endereço(?: de instalação| do imóvel| de correspondência)?|bairro|cidade\/uf|cep(?: do imóvel| de correspondência)?|matrícula(?: do imóvel)?|mês de referência|leitura anterior|leitura atual|consumo faturado|valor da fatura atual|saldo da fatura anterior|data de emissão|data de vencimento|protocolo de atendimento)\b/giu
    const normalizedCurrentLabel = this.normalizeFieldLabel(currentLabel)

    return [...value.matchAll(fieldLabels)].some(
      (match) => this.normalizeFieldLabel(match[0]) !== normalizedCurrentLabel,
    )
  }

  private normalizeFieldValue(value: string) {
    return value.trim().replace(/\s+/g, ' ')
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private getPreservedSuggestionContext(aiSuggestion?: Record<string, unknown>) {
    if (!aiSuggestion) {
      return undefined
    }

    const preservedContext: Record<string, unknown> = {}

    for (const key of [
      'caseId',
      'caseLabel',
      'checklistItemId',
      'checklistItemLabel',
      'failureReason',
      'failureInstruction',
      'metadataCaptured',
    ]) {
      const value = aiSuggestion[key]

      if (value !== undefined) {
        preservedContext[key] = value
      }
    }

    return preservedContext
  }

  private shouldPreserveCurrentAnalysis(document: DocumentValidationDocument) {
    return (
      document.status !== DocumentValidationStatus.Processing &&
      document.status !== DocumentValidationStatus.ProcessingFailure &&
      (document.extractedFields.length > 0 ||
        document.aiSuggestion?.ollamaJsonOrganizationCaptured === true)
    )
  }

  private shouldSkipSuccessfulOrganization(document: DocumentValidationDocument) {
    return (
      document.aiSuggestion?.ollamaJsonOrganizationCaptured === true ||
      document.humanCorrection !== undefined ||
      document.reviewedAt !== undefined
    )
  }
}
