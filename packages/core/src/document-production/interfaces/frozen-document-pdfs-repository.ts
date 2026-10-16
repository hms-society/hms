import type { FrozenDocumentPdf, FrozenDocumentPdfCreation } from '../domain/entities'

export interface FrozenDocumentPdfsRepository {
  removeAll(): Promise<void>
  findByDocumentVersionId(
    documentVersionId: string,
  ): Promise<FrozenDocumentPdf | undefined>
  add(artifact: FrozenDocumentPdfCreation): Promise<FrozenDocumentPdf | undefined>
}
