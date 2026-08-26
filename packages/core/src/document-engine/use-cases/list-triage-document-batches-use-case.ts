import type { DocumentBatchesRepository } from '../interfaces/document-batches-repository'
import type { DocumentBatch } from '../domain/entities'

export class ListTriageDocumentBatchesUseCase {
  constructor(private readonly documentBatchesRepository: DocumentBatchesRepository) {}

  async execute(): Promise<DocumentBatch[]> {
    return await this.documentBatchesRepository.findTriageBatches()
  }
}
