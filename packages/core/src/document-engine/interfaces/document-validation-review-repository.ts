import type { DocumentValidationRecord } from '../domain/entities'
import type { DocumentValidationLogsRepository } from './document-validation-logs-repository'

export interface DocumentValidationReviewRepository {
  /**
   * Persists the validation, audit record, and optional checklist upload publication
   * in one transaction. Return false for stale input without applying any write;
   * exceptions must roll back the whole operation.
   */
  record(input: {
    documentFileId: string
    changes: Pick<
      DocumentValidationRecord,
      'status' | 'reviewedBy' | 'reviewedAt' | 'humanCorrection'
    > & {
      checklistItemId?: string
    }
    expected: {
      clientId: string
      caseId?: string
      checklistItemId?: string
      reviewedAt?: Date
    }
    auditLog: Parameters<DocumentValidationLogsRepository['add']>[0]
    checklistUpload?: {
      uploadId: string
      documentId: string
      clientId: string
      caseId: string
      checklistItemId: string
      reviewedAt: Date
    }
  }): Promise<boolean>
}
