import type { DocumentVersion, DocumentVersionCreation } from '../domain/entities'
import type { DocumentVersionStatus } from '../domain/structures'

export interface DocumentVersionsRepository {
  add(version: DocumentVersionCreation): Promise<DocumentVersion>
  removeAll(): Promise<void>
  findLatestByDocumentId(documentId: string): Promise<DocumentVersion | undefined>
  findByDocumentGenerationId(
    documentGenerationId: string,
  ): Promise<DocumentVersion | undefined>
  findById(documentVersionId: string): Promise<DocumentVersion | undefined>
  findByDocumentIds(documentIds: readonly string[]): Promise<readonly DocumentVersion[]>
  review(
    documentVersionId: string,
    status: Extract<DocumentVersionStatus, 'approved' | 'rejected'>,
    reviewedByCollaboratorId: string,
    reviewedAt: Date,
    rejectionReason?: string,
  ): Promise<DocumentVersion | undefined>
}
