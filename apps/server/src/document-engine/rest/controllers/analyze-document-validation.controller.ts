import { Inject, Param, Post } from '@nestjs/common'
import type {
  DocumentValidationAnalyzerProvider,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import { AnalyzeDocumentValidationUseCase } from '@hms/core/document-engine/use-cases'

import { DOCUMENT_VALIDATION_PROVIDERS } from '@/document-engine/constants/document-validation-providers'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class AnalyzeDocumentValidationController {
  private readonly useCase: AnalyzeDocumentValidationUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(DOCUMENT_VALIDATION_PROVIDERS.analyzer)
    documentValidationAnalyzerProvider: DocumentValidationAnalyzerProvider,
  ) {
    this.useCase = new AnalyzeDocumentValidationUseCase(
      documentValidationsRepository,
      documentValidationAnalyzerProvider,
    )
  }

  @Post('documents/:documentFileId/analyze')
  handle(@Param('documentFileId') documentFileId: string) {
    return this.useCase.execute({ documentFileId })
  }
}
