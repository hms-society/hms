import type { DocumentValidationLog } from '../domain/entities'
import type {
  DocumentValidationDecision,
  DocumentValidationLogAction,
  DocumentValidationStatus,
} from '../domain/structures'

export interface DocumentValidationLogsRepository {
  add(record: {
    documentFileId: string
    actorId?: string
    action: DocumentValidationLogAction
    status?: DocumentValidationStatus
    decision?: DocumentValidationDecision
    reason?: string
    message?: string
    metadata?: Record<string, unknown>
  }): Promise<DocumentValidationLog>

  listByDocumentFileId(documentFileId: string): Promise<DocumentValidationLog[]>
}
