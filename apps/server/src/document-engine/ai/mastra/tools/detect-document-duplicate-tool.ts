import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import { z } from 'zod'

import { outputSchema as workflowOutputSchema } from '@/document-engine/ai/mastra/schemas'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'

const inputSchema = z.object({
  batchId: z.string().uuid(),
  documentFileId: z.string().uuid(),
  storagePath: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  contentBase64: z.string(),
  hashSha256: z.string().length(64),
})
const outputSchema = inputSchema.extend({
  suggestion: workflowOutputSchema.shape.suggestion,
})

@Injectable()
export class DetectDocumentDuplicateTool {
  readonly function: ReturnType<
    typeof createTool<
      'detect-document-duplicate',
      typeof inputSchema,
      typeof outputSchema
    >
  >

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    private readonly validationsRepository: DocumentValidationsRepository,
  ) {
    this.function = createTool({
      id: 'detect-document-duplicate',
      description: 'Detect document duplicates deterministically by SHA-256 hash.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const duplicate = await this.validationsRepository.findDuplicateByHash(
          input.hashSha256,
          input.documentFileId,
        )

        if (!duplicate) {
          return input
        }

        return {
          ...input,
          suggestion: {
            suggestedStatus: DocumentValidationStatus.Duplicate,
            confidence: 1,
            confidenceLabel: 'Duplicidade identificada por hash',
            documentTypeId: this.getStringSuggestion(duplicate, 'documentTypeId'),
            documentTypeLabel: this.getStringSuggestion(duplicate, 'documentTypeLabel'),
            checklistItemId: duplicate.checklistLink?.checklistItemId,
            checklistItemLabel: duplicate.checklistLink?.checklistItemLabel,
            caseId: duplicate.checklistLink?.caseId,
            caseLabel: duplicate.checklistLink?.caseLabel,
            extractedFields: [],
            missingFields: [],
            evidence: [
              {
                field: 'Hash SHA-256',
                sourceText: input.hashSha256,
              },
            ],
            originalDocumentId: duplicate.id,
            originalDocumentFileName: duplicate.fileName,
          },
        }
      },
    })
  }

  private getStringSuggestion(document: DocumentValidationDocument, key: string) {
    const value = document.aiSuggestion?.[key]

    return typeof value === 'string' ? value : undefined
  }
}
