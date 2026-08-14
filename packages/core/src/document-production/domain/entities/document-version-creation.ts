import type {
  DocumentPendingMarker,
  DocumentTemplateContent,
  DocumentVersionSource,
} from '../structures'

export type DocumentVersionCreation = {
  readonly documentId: string
  readonly documentGenerationId?: string
  readonly fileId: string
  readonly versionNumber: number
  readonly source: DocumentVersionSource
  readonly content: DocumentTemplateContent
  readonly pendingMarkers: readonly DocumentPendingMarker[]
  readonly createdByCollaboratorId: string
  readonly createdAt: Date
}
