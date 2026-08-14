import type { DocumentGenerationWorkflowInput } from '../domain/structures'

export interface GenerateDocumentWorkflow {
  run(input: DocumentGenerationWorkflowInput): Promise<void>
}
