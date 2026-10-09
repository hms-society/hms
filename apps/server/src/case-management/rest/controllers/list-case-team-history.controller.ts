import {
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { paginationQuerySchema } from '@hms/validation/shared'
import { ListCaseTeamHistoryUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
  CaseTeamHistoriesRepository,
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

type RequestQuery = { page: number; pageSize: number }

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCaseTeamHistoryController {
  private readonly useCase: ListCaseTeamHistoryUseCase
  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases) legalCases: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers) members: CaseMembersRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseTeamHistories)
    histories: CaseTeamHistoriesRepository,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    collaborators: CaseCollaboratorsProvider,
  ) {
    this.useCase = new ListCaseTeamHistoryUseCase(
      legalCases,
      members,
      histories,
      collaborators,
    )
  }

  @Get(':caseId/team/history')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated append-only case team history.',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: RequestQuery,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      caseId,
      actorId: actor.collaboratorId,
      page: query.page,
      pageSize: query.pageSize,
    })
  }
}
