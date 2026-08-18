import type { DocumentVersionStatus } from '../../../document-production/domain/structures'

export type ConsultationDocumentVersionReviewRequest =
  | {
      readonly decision: typeof DocumentVersionStatus.Approved
      readonly rejectionReason?: never
    }
  | {
      readonly decision: typeof DocumentVersionStatus.Rejected
      readonly rejectionReason: string
    }
