import type { UseCase } from '#shared/interfaces'
import type { DocumentBatchFile } from '../domain/entities'
import { DocumentFileNotFoundError } from '../domain/errors'
import type { DocumentBatchesRepository } from '../interfaces/document-batches-repository'

type Request = { fileId: string }

export class GetDocumentFileUseCase implements UseCase<Request, DocumentBatchFile> {
  constructor(private readonly documentBatchesRepository: DocumentBatchesRepository) {}

  async execute({ fileId }: Request): Promise<DocumentBatchFile> {
    const file = await this.documentBatchesRepository.findFileById(fileId)
    if (!file) {
      throw new DocumentFileNotFoundError()
    }
    return file
  }
}