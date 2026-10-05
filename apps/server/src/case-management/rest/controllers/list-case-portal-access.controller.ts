import { Get, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { ListCasePortalAccessUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
export class ListCasePortalAccessController {
  private readonly useCase: ListCasePortalAccessUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants)
    grantsRepository: CasePortalAccessGrantsRepository,
  ) {
    this.useCase = new ListCasePortalAccessUseCase(legalCasesRepository, grantsRepository)
  }

  @Get(':caseId/portal-access')
  @ApiResponse({ status: HttpStatus.OK, description: 'Active portal links returned.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  async handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    const grants = await this.useCase.execute({
      caseId,
      collaboratorId: collaborator.collaboratorId,
      isAdministrator: collaborator.profile === 'admin',
    })

    return grants.map((grant) => ({
      grantId: grant.id,
      caseId: grant.caseId,
      thirdPartyId: grant.thirdPartyId,
      canUpload: grant.canUpload,
      canViewCaseStatus: grant.canViewCaseStatus,
      canViewIntakeStatus: grant.canViewIntakeStatus,
      createdAt: grant.createdAt.toISOString(),
    }))
  }
}
