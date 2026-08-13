import type { Document, DocumentCreation } from '../domain/entities'

export interface DocumentsRepository {
  add(document: DocumentCreation): Promise<Document>
  addMany(documents: readonly DocumentCreation[]): Promise<readonly Document[]>
  findById(documentId: string): Promise<Document | undefined>
  replace(
    documentId: string,
    changes: Partial<Pick<Document, 'title' | 'currentVersionId'>>,
  ): Promise<Document | undefined>
  removeAll(): Promise<void>
}
