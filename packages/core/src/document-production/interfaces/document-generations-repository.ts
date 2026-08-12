import type { DocumentGeneration, DocumentGenerationCreation } from '../domain/entities'
import type {
  DocumentGenerationStatus,
  DocumentGenerationUpdate,
} from '../domain/structures'

export interface DocumentGenerationsRepository {
  add(generation: DocumentGenerationCreation): Promise<DocumentGeneration>
  findById(documentGenerationId: string): Promise<DocumentGeneration | undefined>
  replace(
    documentGenerationId: string,
    changes: DocumentGenerationUpdate,
    expectedStatuses: readonly DocumentGenerationStatus[],
  ): Promise<DocumentGeneration | undefined>
}
