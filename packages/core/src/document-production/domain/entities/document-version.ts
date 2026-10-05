import type {
  DocumentPendingMarker,
  DocumentTemplateContent,
  DocumentVersionSource,
  DocumentVersionStatus,
} from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

export type DocumentVersion = Entity & {
  documentId: string
  documentGenerationId?: string
  sourceDocumentVersionId?: string
  fileId: string
  storagePath?: string
  versionNumber: number
  source: DocumentVersionSource
  content: DocumentTemplateContent
  /** SHA-256 of the canonical serialized content, when persisted. */
  contentHash?: string
  pendingMarkers: DocumentPendingMarker[]
  createdByCollaboratorId: string
  createdAt: Date
  status: DocumentVersionStatus
  reviewedByCollaboratorId?: string
  reviewedAt?: Date
  rejectionReason?: string
}
