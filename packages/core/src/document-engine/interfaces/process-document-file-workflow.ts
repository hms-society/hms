import type {
  ProcessDocumentFileWorkflowInput,
  ProcessDocumentFileWorkflowResult,
} from '../domain/structures'

export interface ProcessDocumentFileWorkflow {
  run(input: ProcessDocumentFileWorkflowInput): Promise<ProcessDocumentFileWorkflowResult>
}
