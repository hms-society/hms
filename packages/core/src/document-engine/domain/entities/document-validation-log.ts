import type {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

export type DocumentValidationLog = Entity & {
  documentFileId: string
  actorId?: string
  action: DocumentValidationLogAction
  status?: DocumentValidationStatus
  decision?: DocumentValidationDecision
  reason?: string
  message?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}
