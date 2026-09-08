import type { ProcessDocumentFileWorkflowResult } from '../domain/structures'

export interface SuggestDocumentFileWorkflow {
  run(
    input: ProcessDocumentFileWorkflowResult,
  ): Promise<ProcessDocumentFileWorkflowResult>
}
