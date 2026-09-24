import { Body, Inject, Param, Post } from '@nestjs/common'
import type {
  CaseChecklistUpdateProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import { RequestDocumentResendUseCase } from '@hms/core/document-engine/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { DOCUMENT_ENGINE_PROVIDERS } from '@/document-engine/constants/document-engine-providers'
import { CurrentUser } from '@/identity/decorators'
import { DocumentValidationController } from '../decorators/document-validation-controller'

type RequestBody = {
  message: string
  reason?: string
}

@DocumentValidationController()
export class RequestDocumentResendController {
  private readonly useCase: RequestDocumentResendUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(DOCUMENT_ENGINE.documentValidationLogs)
    documentValidationLogsRepository: DocumentValidationLogsRepository,
    @Inject(DOCUMENT_ENGINE_PROVIDERS.caseChecklistUpdate)
    caseChecklistUpdateProvider: CaseChecklistUpdateProvider,
  ) {
    this.useCase = new RequestDocumentResendUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
      caseChecklistUpdateProvider,
    )
  }

  @Post('documents/:documentFileId/resend-request')
  handle(
    @Param('documentFileId') documentFileId: string,
    @Body() body: RequestBody,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.useCase.execute({
      documentFileId,
      reviewedBy: authUser.id,
      message: body.message,
      reason: body.reason,
    })
  }
}
