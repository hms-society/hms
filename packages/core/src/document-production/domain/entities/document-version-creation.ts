import type {
  DocumentPendingMarker,
  DocumentTemplateContent,
  DocumentVersionSource,
  DocumentVersionStatus,
} from '../structures'

export type DocumentVersionCreation = {
  readonly id?: string
  readonly documentId: string
  readonly documentGenerationId?: string
  readonly sourceDocumentVersionId?: string
  readonly fileId: string
  readonly versionNumber: number
  readonly source: DocumentVersionSource
  readonly content: DocumentTemplateContent
  readonly pendingMarkers: readonly DocumentPendingMarker[]
  readonly createdByCollaboratorId: string
  readonly createdAt: Date
  readonly status: DocumentVersionStatus
}
