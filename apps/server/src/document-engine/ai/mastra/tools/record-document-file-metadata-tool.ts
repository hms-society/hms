import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import {
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '@hms/core/document-engine/domain/structures'
import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { outputSchema as workflowOutputSchema } from '@/document-engine/ai/mastra/schemas'

const inputSchema = workflowOutputSchema
const outputSchema = workflowOutputSchema

@Injectable()
export class RecordMetadataTool {
  readonly function: ReturnType<
    typeof createTool<
      'record-document-file-metadata',
      typeof inputSchema,
      typeof outputSchema
    >
  >

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    private readonly validationsRepository: DocumentValidationsRepository,
    @Inject(DOCUMENT_ENGINE.documentValidationLogs)
    private readonly logsRepository: DocumentValidationLogsRepository,
  ) {
    this.function = createTool({
      id: 'record-document-file-metadata',
      description: 'Persist captured metadata for a document file.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        const status = this.resolveAnalysisStatus(input.suggestion?.suggestedStatus)

        await this.validationsRepository.recordAnalysis({
          documentFileId: input.documentFileId,
          status,
          hashSha256: input.metadata.hashSha256,
          aiConfidence: input.suggestion
            ? Math.round(input.suggestion.confidence * 100)
            : 0,
          aiSuggestion: {
            metadataCaptured: true,
            metadata: input.metadata,
            ...(input.suggestion
              ? {
                  documentTypeId: input.suggestion.documentTypeId,
                  documentTypeLabel: input.suggestion.documentTypeLabel,
                  suggestedStatus: input.suggestion.suggestedStatus,
                  confidenceLabel: input.suggestion.confidenceLabel,
                  checklistItemId: input.suggestion.checklistItemId,
                  checklistItemLabel: input.suggestion.checklistItemLabel,
                  caseId: input.suggestion.caseId,
                  caseLabel: input.suggestion.caseLabel,
                  evidence: input.suggestion.evidence,
                  failureReason: input.suggestion.failureReason,
                  failureInstruction: input.suggestion.failureInstruction,
                  originalDocumentId: input.suggestion.originalDocumentId,
                  originalDocumentFileName: input.suggestion.originalDocumentFileName,
                }
              : {}),
          },
          extractedFields: input.suggestion?.extractedFields ?? [],
          missingFields: input.suggestion?.missingFields ?? [],
          caseId: input.suggestion?.caseId,
          checklistItemId: input.suggestion?.checklistItemId,
          originalDocumentId: input.suggestion?.originalDocumentId,
        })

        await this.logsRepository.add({
          documentFileId: input.documentFileId,
          action: DocumentValidationLogAction.MetadataCaptured,
          status,
          message: 'Metadados do documento captados pelo workflow de IA/OCR.',
          metadata: input.metadata,
        })

        return input
      },
    })
  }

  private resolveAnalysisStatus(status: DocumentValidationStatus | undefined) {
    if (!status || status === DocumentValidationStatus.Valid) {
      return DocumentValidationStatus.AwaitingValidation
    }

    return status
  }
}
