import type {
  DocumentBatchesRepository,
  PaginatedTriageBatches,
} from '../interfaces/document-batches-repository'

export type ListTriageDocumentBatchesParams = {
  page?: number
  limit?: number
}

export class ListTriageDocumentBatchesUseCase {
  constructor(private readonly documentBatchesRepository: DocumentBatchesRepository) {}

  async execute(
    params?: ListTriageDocumentBatchesParams,
  ): Promise<PaginatedTriageBatches> {
    return await this.documentBatchesRepository.findTriageBatches(params)
  }
}
