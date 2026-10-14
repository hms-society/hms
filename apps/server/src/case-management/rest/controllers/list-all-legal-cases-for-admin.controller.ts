import { Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { adminCasesQuerySchema } from '@hms/validation/case-management'
import type { AdminCasesQueryData } from '@hms/validation/case-management'
import type {
  CaseCollaboratorsProvider,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { ListAllLegalCasesForAdminUseCase } from '@hms/core/case-management/use-cases'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { AdminLegalCasesPageResponseDto } from '@/case-management/rest/dtos'
import { ZodValidationPipe } from 'nestjs-zod'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListAllLegalCasesForAdminController {
  private readonly useCase: ListAllLegalCasesForAdminUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.areas)
    legalAreasRepository: LegalAreasRepository,
    @Inject(LEGAL_CATALOG_REPOSITORIES.topics)
    legalTopicsRepository: LegalTopicsRepository,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    collaboratorsProvider: CaseCollaboratorsProvider,
  ) {
    this.useCase = new ListAllLegalCasesForAdminUseCase(
      legalCasesRepository,
      clientsRepository,
      legalAreasRepository,
      legalTopicsRepository,
      collaboratorsProvider,
    )
  }

  @Get('admin/list')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A page of operational case metadata was returned successfully.',
    type: AdminLegalCasesPageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The search or pagination query is invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'An active administrator account is required.',
    type: ErrorResponseDto,
  })
  handle(
    @Query(new ZodValidationPipe(adminCasesQuerySchema)) query: AdminCasesQueryData,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      collaboratorProfile: collaborator.profile,
      query,
    })
  }
}
