import { createTool } from '@mastra/core/tools'
import { Inject, Injectable } from '@nestjs/common'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'

import { outputSchema as workflowOutputSchema } from '@/document-engine/ai/mastra/schemas'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'

const inputSchema = workflowOutputSchema
const outputSchema = workflowOutputSchema

@Injectable()
export class ListDocumentReferenceCandidatesTool {
  readonly function: ReturnType<
    typeof createTool<
      'list-document-reference-candidates',
      typeof inputSchema,
      typeof outputSchema
    >
  >

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    private readonly validationsRepository: DocumentValidationsRepository,
  ) {
    this.function = createTool({
      id: 'list-document-reference-candidates',
      description: 'List authoritative case and checklist candidates for a document.',
      inputSchema,
      outputSchema,
      strict: true,
      execute: async (input) => {
        if (input.suggestion?.suggestedStatus === 'duplicate') {
          return input
        }

        const document = await this.validationsRepository.findByFileId(
          input.documentFileId,
        )
        const caseCandidate =
          document?.checklistLink?.caseId && document.checklistLink.caseLabel
            ? {
                id: document.checklistLink.caseId,
                label: document.checklistLink.caseLabel,
              }
            : undefined
        const checklistItemCandidate =
          document?.checklistLink?.checklistItemId &&
          document.checklistLink.caseId &&
          document.checklistLink.checklistItemLabel
            ? {
                id: document.checklistLink.checklistItemId,
                caseId: document.checklistLink.caseId,
                label: document.checklistLink.checklistItemLabel,
              }
            : undefined

        return {
          ...input,
          referenceCandidates: {
            cases: caseCandidate ? [caseCandidate] : [],
            checklistItems: checklistItemCandidate ? [checklistItemCandidate] : [],
          },
        }
      },
    })
  }
}
