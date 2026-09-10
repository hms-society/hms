import { Inject, Injectable } from '@nestjs/common'
import { DocumentFileJsonOrganizationRequestedEvent } from '@hms/core/document-engine/domain/events'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import { eventType, type InngestFunction } from 'inngest'

import { DocumentJsonOrganizerAgent } from '@/document-engine/ai/mastra/agents'
import { buildDocumentJsonOrganizationPrompt } from '@/document-engine/ai/mastra/prompts'
import { documentJsonOrganizationSchema } from '@/document-engine/ai/mastra/schemas'
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
      async ({ event, step }) =>
        step.run('organize-document-file-json-with-ollama', async () => {
          const currentDocument = await this.validationsRepository.findByFileId(
            event.data.documentFileId,
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

          const ollamaResult = await this.generateSuggestion({
            extractedTextFull,
          })

          if (!ollamaResult.captured) {
            return {
              skipped: true,
              reason: ollamaResult.reason,
              documentFileId: event.data.documentFileId,
            }
          }

          const { suggestion } = ollamaResult
          const status = currentDocument.checklistLink?.checklistItemId
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
            caseId: currentDocument.checklistLink?.caseId,
            checklistItemId: currentDocument.checklistLink?.checklistItemId,
            aiSuggestion: {
              ...this.getPreservedSuggestionContext(currentDocument.aiSuggestion),
              suggestedStatus: status,
              confidenceLabel: 'Organizado pelo Ollama',
              evidence: suggestion.evidence,
              metadata: {
                mimeType: event.data.mimeType,
                sizeBytes: event.data.sizeBytes,
                hashSha256: event.data.hashSha256,
                textLength: extractedTextFull.length,
                extractedTextFull,
              },
              ollamaJsonOrganizationCaptured: true,
            },
          })

          return { skipped: false, documentFileId: event.data.documentFileId }
        }),
    )
  }

  private async generateSuggestion(input: {
    extractedTextFull: string
  }): Promise<DocumentJsonOrganizationResult> {
    try {
      const response = await this.documentJsonOrganizerAgent.generate([
        {
          role: 'user',
          content: buildDocumentJsonOrganizationPrompt(
            this.compactText(input.extractedTextFull),
          ),
        },
      ])
      const text = response.text

      if (typeof text !== 'string' || text.trim().length === 0) {
        return { captured: false, reason: 'ollama_empty_response' }
      }

      const suggestion = documentJsonOrganizationSchema.parse(
        JSON.parse(this.extractJson(text)),
      )

      if (suggestion.extractedFields.length === 0) {
        return {
          captured: false,
          reason: 'ollama_empty_extracted_fields',
        }
      }

      return { captured: true, suggestion }
    } catch (error) {
      return {
        captured: false,
        reason:
          error instanceof Error && error.message.trim().length > 0
            ? error.message.trim().slice(0, 180)
            : 'ollama_unknown_error',
      }
    }
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

  private compactText(text: string) {
    return text.replace(/\s+/g, ' ').trim().slice(0, 3000)
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
}
