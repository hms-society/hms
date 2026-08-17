import { Get, Inject, Query } from '@nestjs/common'
import type { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import { ListDocumentValidationsUseCase } from '@hms/core/document-engine/use-cases'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class ListDocumentValidationsController {
  private readonly useCase: ListDocumentValidationsUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
  ) {
    this.useCase = new ListDocumentValidationsUseCase(documentValidationsRepository)
  }

  @Get('documents')
  handle(@Query('status') status?: DocumentValidationStatus) {
    return this.useCase.execute({ status })
  }
}
