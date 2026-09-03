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
import { z } from 'zod'

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
        await this.validationsRepository.recordAnalysis({
          documentFileId: input.documentFileId,
          status: DocumentValidationStatus.AwaitingValidation,
          hashSha256: input.metadata.hashSha256,
          aiConfidence: 0,
          aiSuggestion: {
            metadataCaptured: true,
            metadata: input.metadata,
          },
          extractedFields: [],
          missingFields: [],
        })

        await this.logsRepository.add({
          documentFileId: input.documentFileId,
          action: DocumentValidationLogAction.MetadataCaptured,
          status: DocumentValidationStatus.AwaitingValidation,
          message: 'Metadados do documento captados pelo workflow de IA/OCR.',
          metadata: input.metadata,
        })

        return input
      },
    })
  }
}
