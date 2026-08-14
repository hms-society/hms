import type { DocumentGenerationSource } from './document-generation-source'

export type DocumentGenerationWorkflowInput = {
  readonly documentGenerationId: string
  readonly documentId: string
  readonly documentSpecificationVersionId: string
  readonly requestedByCollaboratorId: string
  readonly source: DocumentGenerationSource
}
