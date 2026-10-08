import {
  Body,
  Delete,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiBody, ApiResponse } from '@nestjs/swagger'
import { DeleteCaseTaskUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseMembersRepository,
  CaseTasksRepository,
} from '@hms/core/case-management/interfaces'
import { ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import {
  DeleteCaseTaskRequestDto,
  deleteCaseTaskSchema,
  CaseTaskResponseDto,
} from '@/case-management/rest/dtos'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

type RequestBody = Parameters<DeleteCaseTaskUseCase['execute']>[0]

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class DeleteCaseTaskController {
  private readonly useCase: DeleteCaseTaskUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseTasks)
    caseTasksRepository: CaseTasksRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
    @Inject(DatetimeProvider)
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new DeleteCaseTaskUseCase(
      caseTasksRepository,
      caseMembersRepository,
      datetimeProvider,
    )
  }

  @Delete(':caseId/tasks/:caseTaskId')
  @ApiBody({ type: DeleteCaseTaskRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case task was logically deleted.',
    type: CaseTaskResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('caseTaskId', new ParseUUIDPipe()) caseTaskId: string,
    @Body(new ZodValidationPipe(deleteCaseTaskSchema)) body: Omit<
      RequestBody,
      'caseId' | 'caseTaskId'
    >,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...body,
      caseId,
      caseTaskId,
      actorId: collaborator.collaboratorId,
    })
  }
}
