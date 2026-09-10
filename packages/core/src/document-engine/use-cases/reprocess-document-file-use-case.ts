import { DocumentFileProcessingRequestedEvent } from '../domain/events'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import type { Broker } from '../../shared/interfaces'
import { AppError } from '../../shared/domain/errors'

export type ReprocessDocumentFileRequest = {
  documentFileId: string
}

export class ReprocessDocumentFileUseCase {
  constructor(
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly broker: Broker,
  ) {}

  async execute(request: ReprocessDocumentFileRequest) {
    const file = await this.documentBatchesRepository.findFileById(
      request.documentFileId,
    )

    if (!file) {
      throw new AppError(
        'O documento informado para reprocessamento não foi encontrado.',
        'Documento não encontrado',
      )
    }

    const document = await this.documentValidationsRepository.recordProcessing(
      request.documentFileId,
    )

    await this.broker.publish(
      new DocumentFileProcessingRequestedEvent({
        batchId: file.batchId,
        documentFileId: file.id,
        storagePath: file.storagePath,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      }),
    )

    return document
  }
}
