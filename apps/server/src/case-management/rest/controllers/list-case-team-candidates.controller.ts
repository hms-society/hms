import { Get, HttpStatus, Inject, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { caseTeamCandidatesQuerySchema } from '@hms/validation/case-management'
import { ListCaseTeamCandidatesUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from 'nestjs-zod'

type RequestQuery = Omit<
  Parameters<ListCaseTeamCandidatesUseCase['execute']>[0],
  'actorId'
>

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCaseTeamCandidatesController {
  private readonly useCase: ListCaseTeamCandidatesUseCase
  constructor(
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    collaborators: CaseCollaboratorsProvider,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) legalCases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers) caseMembers: CaseMembersRepository,
  ) {
    this.useCase = new ListCaseTeamCandidatesUseCase(
      collaborators,
      legalCases,
      caseMembers,
    )
  }

  @Get('team-candidates')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eligible, filtered and paginated case team candidates.',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Query(new ZodValidationPipe(caseTeamCandidatesQuerySchema)) query: RequestQuery,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...query,
      actorId: actor.collaboratorId,
      caseId: query.caseId,
    })
  }
}
