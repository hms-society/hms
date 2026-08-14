import type {
  DocumentVersionSource,
  DocumentVersionStatus,
} from '../../../document-production/domain/structures'

export type ConsultationDocumentVersionSummary = {
  readonly id: string
  readonly versionNumber: number
  readonly source: DocumentVersionSource
  readonly status: DocumentVersionStatus
  readonly pendingMarkersCount: number
  readonly createdByCollaboratorId: string
  readonly createdAt: string
  readonly reviewedByCollaboratorId?: string
  readonly reviewedAt?: string
  readonly rejectionReason?: string
}
