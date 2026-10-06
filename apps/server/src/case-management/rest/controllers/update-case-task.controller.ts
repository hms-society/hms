import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common'
import { ApiBody, ApiResponse } from '@nestjs/swagger'
import { UpdateCaseTaskUseCase } from '@hms/core/case-management/use-cases'
import type { CaseMembersRepository, CaseTasksRepository } from '@hms/core/case-management/interfaces'
import { ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import {
  UpdateCaseTaskRequestDto,
  updateCaseTaskSchema,
  CaseTaskResponseDto,
} from '@/case-management/rest/dtos'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<UpdateCaseTaskUseCase['execute']>[0],
  'caseId' | 'caseTaskId' | 'actorId'
>

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class UpdateCaseTaskController {
  private readonly useCase: UpdateCaseTaskUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseTasks)
    caseTasksRepository: CaseTasksRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
    @Inject(DatetimeProvider)
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new UpdateCaseTaskUseCase(
      caseTasksRepository,
      caseMembersRepository,
      datetimeProvider,
    )
  }

  @Patch(':caseId/tasks/:caseTaskId')
  @ApiBody({ type: UpdateCaseTaskRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case task was updated.',
    type: CaseTaskResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('caseTaskId', new ParseUUIDPipe()) caseTaskId: string,
    @Body(new ZodValidationPipe(updateCaseTaskSchema)) body: RequestBody,
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
