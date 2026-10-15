import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ListCaseTasksUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseAccessProvider,
  CaseTasksRepository,
} from '@hms/core/case-management/interfaces'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { ErrorResponseDto } from '@/shared/rest/dtos'
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
    @Inject(CASE_MANAGEMENT_ACCESS.access)
    caseAccessProvider: CaseAccessProvider,
  ) {
    this.useCase = new ListCaseTasksUseCase(caseTasksRepository, caseAccessProvider)
  }

  @Get(':caseId/tasks')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case tasks were returned.',
    type: [CaseTaskResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Case read access denied.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Case not found.',
    type: ErrorResponseDto,
  })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({ caseId, actorId: collaborator.collaboratorId })
  }
}
