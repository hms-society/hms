import { Get, Inject, Param } from '@nestjs/common'
import type { DocumentValidationLogsRepository } from '@hms/core/document-engine/interfaces'
import { ListDocumentValidationLogsUseCase } from '@hms/core/document-engine/use-cases'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class ListDocumentValidationLogsController {
  private readonly useCase: ListDocumentValidationLogsUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidationLogs)
    documentValidationLogsRepository: DocumentValidationLogsRepository,
  ) {
    this.useCase = new ListDocumentValidationLogsUseCase(
      documentValidationLogsRepository,
    )
  }

  @Get('documents/:documentFileId/logs')
  handle(@Param('documentFileId') documentFileId: string) {
    return this.useCase.execute({ documentFileId })
  }
}
