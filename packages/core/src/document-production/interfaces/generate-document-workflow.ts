import type { DocumentGenerationWorkflowInput } from '../domain/structures'

export type DocumentGenerationWorkflowResult =
  | {
      status: 'approved'
      documentGenerationId: string
      documentVersionId: string
      attemptsCount: number
      pendingMarkersCount: number
    }
  | {
      status: 'failed'
      documentGenerationId: string
      attemptsCount: number
      findingsCount: number
    }

export interface GenerateDocumentWorkflow {
  run(input: DocumentGenerationWorkflowInput): Promise<DocumentGenerationWorkflowResult>
}
