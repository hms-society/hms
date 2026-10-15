import { Get, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import type { LegalAreasRepository } from '@hms/core/legal-catalog/interfaces'
import type { LegalTopicsRepository } from '@hms/core/legal-catalog/interfaces'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
} from '@hms/core/case-management/interfaces'
import { GetLegalCaseDetailsUseCase } from '@hms/core/case-management/use-cases'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetLegalCaseDetailsController {
  private readonly useCase: GetLegalCaseDetailsUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    legalTopicsRepository: LegalTopicsRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    collaboratorsProvider: CaseCollaboratorsProvider,
  ) {
    this.useCase = new GetLegalCaseDetailsUseCase(
      legalCasesRepository,
      clientsRepository,
      legalAreasRepository,
      legalTopicsRepository,
      caseMembersRepository,
      collaboratorsProvider,
    )
  }

  @Get(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The legal case details were returned successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Legal case not found.',
    type: ErrorResponseDto,
  })
  handle(@Param('id') caseId: string, @CurrentCollaborator() actor: CollaboratorSummary) {
    return this.useCase.execute({ caseId, actorId: actor.collaboratorId })
  }
}
