import { Inject, Param, Post } from '@nestjs/common'
import type {
  DocumentValidationAnalyzerProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import { AnalyzeDocumentValidationUseCase } from '@hms/core/document-engine/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { DOCUMENT_VALIDATION_PROVIDERS } from '@/document-engine/constants/document-validation-providers'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { CurrentUser } from '@/identity/decorators'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class AnalyzeDocumentValidationController {
  private readonly useCase: AnalyzeDocumentValidationUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(DOCUMENT_VALIDATION_PROVIDERS.analyzer)
    documentValidationAnalyzerProvider: DocumentValidationAnalyzerProvider,
    @Inject(DOCUMENT_ENGINE.documentValidationLogs)
    documentValidationLogsRepository: DocumentValidationLogsRepository,
  ) {
    this.useCase = new AnalyzeDocumentValidationUseCase(
      documentValidationsRepository,
      documentValidationAnalyzerProvider,
      documentValidationLogsRepository,
    )
  }

  @Post('documents/:documentFileId/analyze')
  handle(
    @Param('documentFileId') documentFileId: string,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.useCase.execute({ documentFileId, requestedBy: authUser.id })
  }
}
