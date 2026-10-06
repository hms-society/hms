import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ListCaseTasksUseCase } from '@hms/core/case-management/use-cases'
import type { CaseTasksRepository } from '@hms/core/case-management/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CaseTaskResponseDto } from '@/case-management/rest/dtos'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCaseTasksController {
  private readonly useCase: ListCaseTasksUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseTasks)
    caseTasksRepository: CaseTasksRepository,
  ) {
    this.useCase = new ListCaseTasksUseCase(caseTasksRepository)
  }

  @Get(':caseId/tasks')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case tasks were returned.',
    type: [CaseTaskResponseDto],
  })
  handle(@Param('caseId', new ParseUUIDPipe()) caseId: string) {
    return this.useCase.execute(caseId)
  }
}
