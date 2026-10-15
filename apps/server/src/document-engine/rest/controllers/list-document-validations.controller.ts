import { Get, Inject, ParseUUIDPipe, Query } from '@nestjs/common'
import type { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import { ListDocumentValidationsUseCase } from '@hms/core/document-engine/use-cases'
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

/**
 * @deprecated Rota legada de validações mockadas. A triagem oficial de lotes documentais
 * utiliza o endpoint GET /document-batches/triage (ListTriageDocumentBatchesController).
 */
@DocumentValidationController()
export class ListDocumentValidationsController {
  private readonly useCase: ListDocumentValidationsUseCase

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
    this.useCase = new ListDocumentValidationsUseCase(
      documentValidationsRepository,
      caseAccess,
      cases,
      checklistItems,
      collaborators,
      users,
    )
  }

  @Get('documents')
  handle(
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Query('caseId', new ParseUUIDPipe({ optional: true })) caseId?: string,
    @Query('status') status?: DocumentValidationStatus,
  ) {
    return this.useCase.execute({
      caseId,
      status,
      actorId: collaborator.collaboratorId,
    })
  }
}
