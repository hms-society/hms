import { Get, Inject, Param } from '@nestjs/common'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import { GetDocumentValidationUseCase } from '@hms/core/document-engine/use-cases'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type {
  CollaboratorsRepository,
  UsersRepository,
} from '@hms/core/identity/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { CurrentCollaborator } from '@/identity/decorators'
import { DocumentValidationController } from '../decorators/document-validation-controller'

@DocumentValidationController()
export class GetDocumentValidationController {
  private readonly useCase: GetDocumentValidationUseCase

  constructor(
    @Inject(DOCUMENT_ENGINE.documentValidations)
    documentValidationsRepository: DocumentValidationsRepository,
    @Inject(CASE_MANAGEMENT_ACCESS.access) caseAccess: CaseAccessProvider,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    checklistItems: CaseChecklistItemsRepository,
    @Inject(IDENTITY_REPOSITORIES.collaborators)
    collaborators: CollaboratorsRepository,
    @Inject(IDENTITY_REPOSITORIES.users) users: UsersRepository,
  ) {
    this.useCase = new GetDocumentValidationUseCase(
      documentValidationsRepository,
      caseAccess,
      cases,
      checklistItems,
      collaborators,
      users,
    )
  }

  @Get('documents/:documentFileId')
  handle(
    @Param('documentFileId') documentFileId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      documentFileId,
      actorId: collaborator.collaboratorId,
    })
  }
}
