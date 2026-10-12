import { DocumentFileProcessingRequestedEvent } from '../domain/events'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '../interfaces'
import type { Broker } from '../../shared/interfaces'
import { AppError } from '../../shared/domain/errors'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'
import type { GetDocumentValidationUseCase } from './get-document-validation-use-case'
import type { ReprocessDocumentFileRequest } from '../domain/structures'

export type { ReprocessDocumentFileRequest } from '../domain/structures'

export class ReprocessDocumentFileUseCase {
  constructor(
    private readonly documentBatchesRepository: DocumentBatchesRepository,
    private readonly documentValidationsRepository: DocumentValidationsRepository,
    private readonly broker: Broker,
    private readonly caseAccessProvider: CaseAccessProvider,
    private readonly getDocumentValidation: GetDocumentValidationUseCase,
  ) {}

  async execute(request: ReprocessDocumentFileRequest) {
    const owner = await this.documentValidationsRepository.findByFileId(
      request.documentFileId,
    )
    if (!owner) {
      throw new AppError(
        'O documento informado para reprocessamento não foi encontrado.',
        'Documento não encontrado',
      )
    }
    const caseId = owner.checklistLink?.caseId
    if (caseId) {
      await this.caseAccessProvider.authorize({
        caseId,
        actorId: request.actorId,
        intent: CaseAccessIntent.WriteContent,
      })
    }

    const file = await this.documentBatchesRepository.findFileById(request.documentFileId)

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

    return this.getDocumentValidation.execute({
      documentFileId: document.id,
      actorId: request.actorId,
    })
  }
}
