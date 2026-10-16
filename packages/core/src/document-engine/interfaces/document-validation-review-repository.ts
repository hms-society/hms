import type { DocumentValidationRecord } from '../domain/entities'

export interface DocumentValidationReviewRepository {
  replace(
    documentFileId: string,
    changes: Pick<
      DocumentValidationRecord,
      'status' | 'reviewedBy' | 'reviewedAt' | 'humanCorrection'
    > & {
      checklistItemId?: string
    },
    expected: {
      clientId: string
      caseId?: string
      checklistItemId?: string
      reviewedAt?: Date
    },
  ): Promise<boolean>
}
