import type { DocumentVersionSource } from '../structures'

export type DocumentVersion = {
  id: string
  documentId: string
  fileId: string
  versionNumber: number
  source: DocumentVersionSource
  createdByCollaboratorId: string
  createdAt: Date
}
