import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { GetCaseTeamUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseMembersRepository,
  CaseCollaboratorsProvider,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetCaseTeamController {
  private readonly useCase: GetCaseTeamUseCase
  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) legalCases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers) caseMembers: CaseMembersRepository,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    collaborators: CaseCollaboratorsProvider,
  ) {
    this.useCase = new GetCaseTeamUseCase(legalCases, caseMembers, collaborators)
  }

  @Get(':caseId/team')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current team and operational capabilities.',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    return this.useCase.execute({ caseId, actorId: actor.collaboratorId })
  }
}
