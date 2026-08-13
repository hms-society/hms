import type { DocumentVersion, DocumentVersionCreation } from '../domain/entities'

export interface DocumentVersionsRepository {
  add(version: DocumentVersionCreation): Promise<DocumentVersion>
  findLatestByDocumentId(documentId: string): Promise<DocumentVersion | undefined>
  findByDocumentGenerationId(
    documentGenerationId: string,
  ): Promise<DocumentVersion | undefined>
}
