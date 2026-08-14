import type {
  DocumentGenerationFinding,
  DocumentGenerationSource,
  DocumentGenerationStatus,
  DocumentGenerationTemplate,
} from '../structures'

export type DocumentGeneration = {
  readonly id: string
  readonly documentId: string
  readonly documentSpecificationVersionId: string
  readonly requestedByCollaboratorId: string
  readonly source: DocumentGenerationSource
  readonly template: DocumentGenerationTemplate
  readonly status: DocumentGenerationStatus
  readonly attemptsCount: number
  readonly findings: readonly DocumentGenerationFinding[]
  readonly documentVersionId?: string
  readonly failureMessage?: string
  readonly startedAt?: Date
  readonly completedAt?: Date
  readonly failedAt?: Date
  readonly cancelledAt?: Date
  readonly createdAt: Date
  readonly updatedAt: Date
}
