import type { Document, DocumentCreation, ClassificacaoAcesso } from '../domain/entities'

export interface UpdateClassificationWithAuditParams {
  documentId: string
  userId: string
  valorAnterior: ClassificacaoAcesso
  valorNovo: ClassificacaoAcesso
}

export interface DocumentsRepository {
  add(document: DocumentCreation): Promise<Document>
  addMany(documents: readonly DocumentCreation[]): Promise<readonly Document[]>
  findById(documentId: string): Promise<Document | undefined>
  findByIds(documentIds: readonly string[]): Promise<readonly Document[]>
  replace(
    documentId: string,
    changes: Partial<Pick<Document, 'title' | 'currentVersionId'>>,
  ): Promise<Document | undefined>
  removeAll(): Promise<void>

  updateClassificationWithAudit(
    params: UpdateClassificationWithAuditParams,
  ): Promise<void>
}
