import { Get, HttpStatus, Inject, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
} from '@hms/core/case-management/interfaces'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import { ListMyLegalCasesUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListMyLegalCasesController {
  private readonly useCase: ListMyLegalCasesUseCase

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
    this.useCase = new ListMyLegalCasesUseCase(
      legalCasesRepository,
      clientsRepository,
      legalAreasRepository,
      legalTopicsRepository,
      caseMembersRepository,
      collaboratorsProvider,
    )
  }

  @Get('my')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The current collaborator case list was returned successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'An active collaborator account is required.',
    type: ErrorResponseDto,
  })
  handle(
    @CurrentCollaborator() collaborator: CollaboratorSummary,
    @Query('clientId', new ParseUUIDPipe({ optional: true })) clientId?: string,
  ) {
    return this.useCase.execute({ collaboratorId: collaborator.collaboratorId, clientId })
  }
}
