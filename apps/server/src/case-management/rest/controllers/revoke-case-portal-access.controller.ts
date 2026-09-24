import { Delete, HttpStatus, Inject, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type {
  LegalCasesRepository,
  CasePortalAccessGrantsRepository,
} from '@hms/core/case-management/interfaces'
import { RevokeCasePortalAccessUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
export class RevokeCasePortalAccessController {
  private readonly useCase: RevokeCasePortalAccessUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants)
    grantsRepository: CasePortalAccessGrantsRepository,
  ) {
    this.useCase = new RevokeCasePortalAccessUseCase(
      legalCasesRepository,
      grantsRepository,
    )
  }

  @Delete(':caseId/portal-access/:grantId')
  @ApiResponse({ status: HttpStatus.OK, description: 'Case portal access revoked.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('grantId', new ParseUUIDPipe()) grantId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      grantId,
      collaboratorId: collaborator.collaboratorId,
      isAdministrator: collaborator.profile === 'admin',
    })
  }
}
