import type { DocumentGeneration, DocumentGenerationCreation } from '../domain/entities'
import type {
  DocumentGenerationStatus,
  DocumentGenerationUpdate,
} from '../domain/structures'

export interface DocumentGenerationsRepository {
  add(generation: DocumentGenerationCreation): Promise<DocumentGeneration>
  addOrGet(generation: DocumentGenerationCreation): Promise<DocumentGeneration>
  removeAll(): Promise<void>
  findById(documentGenerationId: string): Promise<DocumentGeneration | undefined>
  findLatestByDocumentId(documentId: string): Promise<DocumentGeneration | undefined>
  findLatestByDocumentIds(
    documentIds: readonly string[],
  ): Promise<readonly DocumentGeneration[]>
  replace(
    documentGenerationId: string,
    changes: DocumentGenerationUpdate,
    expectedStatuses: readonly DocumentGenerationStatus[],
  ): Promise<DocumentGeneration | undefined>
}
