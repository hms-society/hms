import type { DocumentBatch } from '../domain/entities'

export interface DocumentBatchRepository {
  findById(documentBatchId: string): Promise<DocumentBatch | undefined>
  save(documentBatch: DocumentBatch): Promise<void>
}
