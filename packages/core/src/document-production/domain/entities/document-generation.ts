import type {
  DocumentGenerationFinding,
  DocumentGenerationSource,
  DocumentGenerationStatus,
  DocumentGenerationTemplate,
} from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

export type DocumentGeneration = Entity & {
  documentId: string
  documentSpecificationVersionId: string
  requestedByCollaboratorId: string
  source: DocumentGenerationSource
  template: DocumentGenerationTemplate
  status: DocumentGenerationStatus
  attemptsCount: number
  findings: DocumentGenerationFinding[]
  documentVersionId?: string
  failureMessage?: string
  startedAt?: Date
  completedAt?: Date
  failedAt?: Date
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}
