import { Body, Inject, Param, Post } from '@nestjs/common'
import type {
  CaseChecklistUpdateProvider,
  DocumentValidationLogsRepository,
  DocumentValidationsRepository,
} from '@hms/core/document-engine/interfaces'
import {
  GetDocumentValidationUseCase,
  RequestDocumentResendUseCase,
} from '@hms/core/document-engine/use-cases'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import type { AuthUser } from '@hms/core/identity/domain/structures'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import type { CaseAccessProvider } from '@hms/core/case-management/interfaces'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { DOCUMENT_ENGINE_PROVIDERS } from '@/document-engine/constants/document-engine-providers'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentCollaborator, CurrentUser } from '@/identity/decorators'
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
    @Inject(CASE_MANAGEMENT_ACCESS.access) caseAccessProvider: CaseAccessProvider,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    checklistItems: CaseChecklistItemsRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaborators: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.users) users: UsersRepository,
  ) {
    const getDocumentValidation = new GetDocumentValidationUseCase(
      documentValidationsRepository,
      caseAccessProvider,
      cases,
      checklistItems,
      collaborators,
      users,
    )
    this.useCase = new RequestDocumentResendUseCase(
      documentValidationsRepository,
      documentValidationLogsRepository,
      caseAccessProvider,
      getDocumentValidation,
      caseChecklistUpdateProvider,
    )
  }

  @Post('documents/:documentFileId/resend-request')
  handle(
    @Param('documentFileId') documentFileId: string,
    @Body() body: RequestBody,
    @CurrentUser() authUser: AuthUser,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      documentFileId,
      reviewedBy: authUser.id,
      actorId: collaborator.collaboratorId,
      message: body.message,
      reason: body.reason,
    })
  }
}
