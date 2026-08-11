import type { DocumentBatchesRepository } from '../interfaces/document-batches-repository'
import type { DocumentBatch } from '../domain/entities'

export class ListClientDocumentBatchUseCase {
  constructor(private readonly documentBatchesRepository: DocumentBatchesRepository) {}

  async execute(clientId: string): Promise<DocumentBatch[]> {
    return await this.documentBatchesRepository.findById(clientId)
  }
}
