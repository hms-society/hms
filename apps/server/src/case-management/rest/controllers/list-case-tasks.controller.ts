import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ListCaseTasksUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseMembersRepository,
  CaseTasksRepository,
} from '@hms/core/case-management/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CaseTaskResponseDto } from '@/case-management/rest/dtos'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCaseTasksController {
  private readonly useCase: ListCaseTasksUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseTasks)
    caseTasksRepository: CaseTasksRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
  ) {
    this.useCase = new ListCaseTasksUseCase(caseTasksRepository, caseMembersRepository)
  }

  @Get(':caseId/tasks')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case tasks were returned.',
    type: [CaseTaskResponseDto],
  })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({ caseId, actorId: collaborator.collaboratorId })
  }
}
