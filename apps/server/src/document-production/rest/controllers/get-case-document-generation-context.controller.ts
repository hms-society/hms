import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type { DocumentValidationsRepository } from '@hms/core/document-engine/interfaces'
import type { DocumentSpecificationsRepository } from '@hms/core/document-production/interfaces'
import { GetCaseDocumentGenerationContextUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { CaseDocumentGenerationContextResponseDto } from '@/document-production/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetCaseDocumentGenerationContextController {
  private readonly useCase: GetCaseDocumentGenerationContextUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) cases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    checklist: CaseChecklistItemsRepository,
    @Inject(DOCUMENT_ENGINE.documentValidations)
    validations: DocumentValidationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    specifications: DocumentSpecificationsRepository,
  ) {
    this.useCase = new GetCaseDocumentGenerationContextUseCase(
      cases,
      checklist,
      validations,
      specifications,
    )
  }

  @Get(':caseId/document-generation-context')
  @ApiResponse({ status: HttpStatus.OK, type: CaseDocumentGenerationContextResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase
      .execute({
        caseId,
        collaboratorId: collaborator.collaboratorId,
        isAdmin: collaborator.profile === 'admin',
      })
      .then(CaseDocumentGenerationContextResponseDto.fromDomain)
  }
}
