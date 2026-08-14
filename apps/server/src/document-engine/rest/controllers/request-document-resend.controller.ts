import { Body, Inject, Param, Post } from '@nestjs/common'
import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import { RequestDocumentResendUseCase } from '@hms/core/document-engine/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
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
  ) {
    this.useCase = new RequestDocumentResendUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
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
