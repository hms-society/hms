import type { Entity } from '../../../shared/domain/entities/entity'
import type { DocumentPdfPage, DocumentVersionSource } from '../structures'

export type FrozenDocumentPdf = Entity & {
  documentId: string
  documentVersionId: string
  documentVersionNumber: number
  documentSpecificationId: string
  sourceDocumentVersionId?: string
  source: DocumentVersionSource
  sourceFileId: string
  pdfFileId: string
  sourceSha256: string
  pdfSha256: string
  converterVersion: string
  pageCount: number
  pages: readonly DocumentPdfPage[]
  byteSize: number
  approvedByCollaboratorId: string
  approvedAt: Date
  frozenAt: Date
  createdAt: Date
}
