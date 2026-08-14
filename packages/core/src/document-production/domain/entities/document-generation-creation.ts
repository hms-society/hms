import type {
  DocumentGenerationFinding,
  DocumentGenerationSource,
  DocumentGenerationStatus,
  DocumentGenerationTemplate,
} from '../structures'

export type DocumentGenerationCreation = {
  readonly id: string
  readonly documentId: string
  readonly documentSpecificationVersionId: string
  readonly requestedByCollaboratorId: string
  readonly source: DocumentGenerationSource
  readonly template: DocumentGenerationTemplate
  readonly status: DocumentGenerationStatus
  readonly attemptsCount: number
  readonly findings: readonly DocumentGenerationFinding[]
}
