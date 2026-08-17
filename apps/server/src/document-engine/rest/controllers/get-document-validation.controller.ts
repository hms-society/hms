import { Get, Inject, Param } from '@nestjs/common'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import { GetDocumentValidationUseCase } from '@hms/core/document-engine/use-cases'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class GetDocumentValidationController {
  private readonly useCase: GetDocumentValidationUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
  ) {
    this.useCase = new GetDocumentValidationUseCase(documentValidationsRepository)
  }

  @Get('documents/:documentFileId')
  handle(@Param('documentFileId') documentFileId: string) {
    return this.useCase.execute({ documentFileId })
  }
}
