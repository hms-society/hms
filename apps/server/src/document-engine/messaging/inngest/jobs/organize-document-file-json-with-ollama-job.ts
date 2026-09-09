import { Inject, Injectable } from '@nestjs/common'
import { DocumentFileJsonOrganizationRequestedEvent } from '@hms/core/document-engine/domain/events'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import { eventType, type InngestFunction } from 'inngest'

import { DocumentJsonOrganizerAgent } from '@/document-engine/ai/mastra/agents'
import {
  documentJsonOrganizationSchema,
  type DocumentJsonOrganization,
} from '@/document-engine/ai/mastra/schemas'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { documentFileJsonOrganizationRequestedSchema } from '@/document-engine/messaging/inngest/schemas/document-file-json-organization-requested-schema'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestJob } from '@/shared/messaging/inngest/inngest-job'

const documentFileJsonOrganizationRequested = eventType(
  DocumentFileJsonOrganizationRequestedEvent._NAME,
  { schema: documentFileJsonOrganizationRequestedSchema },
)

type OllamaSuggestionResult =
  | {
      captured: true
      suggestion: DocumentJsonOrganization
    }
  | {
      captured: false
      reason: string
    }

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
              ...this.omitLegacyAiFlags(currentDocument.aiSuggestion),
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
  }): Promise<OllamaSuggestionResult> {
    try {
      const response = await this.documentJsonOrganizerAgent.generate([
        {
          role: 'user',
          content: `Organize this OCR text into JSON fields.

Return exactly this JSON shape:
{
  "confidence": 0.45,
  "extractedFields": [
    { "label": "field label", "value": "visible value", "confidence": 0.8 }
  ],
  "evidence": [
    { "field": "field label", "sourceText": "short visible snippet" }
  ]
}

Rules:
- Do not classify the document.
- Do not return documentTypeId or documentTypeLabel.
- Do not invent missing fields.
- Split compound OCR text into the clearest labeled fields.
- Keep labels in Portuguese when the OCR text is Portuguese.
- Return confidence between 0 and 1.
- Return JSON only.

OCR text:
${this.compactText(input.extractedTextFull)}`,
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

  private omitLegacyAiFlags(aiSuggestion?: Record<string, unknown>) {
    if (!aiSuggestion) {
      return undefined
    }

    const {
      documentTypeId: _documentTypeId,
      documentTypeLabel: _documentTypeLabel,
      geminiJsonOrganizationCaptured: _gemini,
      ...sanitized
    } = aiSuggestion

    return sanitized
  }
}
