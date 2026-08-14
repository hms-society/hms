import { Body, Inject, Param, Patch } from '@nestjs/common'
import type { DocumentValidationDecision } from '@hms/core/document-engine/domain/structures'
import type {
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import { RecordDocumentValidationDecisionUseCase } from '@hms/core/document-engine/use-cases'
import type { AuthUser } from '@hms/core/identity/domain/structures'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { CurrentUser } from '@/identity/decorators'
import { DocumentValidationController } from '../decorators/document-validation-controller'

type RequestBody = {
  decision: DocumentValidationDecision
  documentTypeId?: string
  checklistRequirementId?: string
  reason?: string
  originalDocumentId?: string
}

@DocumentValidationController()
export class RecordDocumentValidationDecisionController {
  private readonly useCase: RecordDocumentValidationDecisionUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(DOCUMENT_ENGINE.documentValidationLogs)
    documentValidationLogsRepository: DocumentValidationLogsRepository,
  ) {
    this.useCase = new RecordDocumentValidationDecisionUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
    )
  }

  @Patch('documents/:documentFileId/decision')
  handle(
    @Param('documentFileId') documentFileId: string,
    @Body() body: RequestBody,
    @CurrentUser() authUser: AuthUser,
  ) {
    return this.useCase.execute({
      documentFileId,
      reviewedBy: authUser.id,
      ...body,
    })
  }
}
