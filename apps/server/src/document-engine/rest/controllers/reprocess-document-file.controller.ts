import { Inject, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import type {
  DocumentBatchesRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import { ReprocessDocumentFileUseCase } from '@hms/core/document-engine/use-cases'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { InngestBroker } from '@/shared/messaging/inngest/inngest-broker'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class ReprocessDocumentFileController {
  private readonly useCase: ReprocessDocumentFileUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentBatches)
    documentBatchesRepository: DocumentBatchesRepository,
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    broker: InngestBroker,
  ) {
    this.useCase = new ReprocessDocumentFileUseCase(
      documentBatchesRepository,
      documentValidationsRepository,
      broker,
    )
  }

  @Post('documents/:documentFileId/reprocess')
  handle(@Param('documentFileId', ParseUUIDPipe) documentFileId: string) {
    return this.useCase.execute({ documentFileId })
  }
}
