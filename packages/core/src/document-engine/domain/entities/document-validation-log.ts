import type {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../structures'

export type DocumentValidationLog = {
  id: string
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
