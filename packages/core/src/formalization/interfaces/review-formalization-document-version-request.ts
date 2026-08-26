import type { DocumentVersionStatus } from '../../document-production/domain/structures'

export type ReviewFormalizationDocumentVersionRequest = {
  readonly status: Extract<DocumentVersionStatus, 'approved' | 'rejected'>
  readonly rejectionReason?: string
}
