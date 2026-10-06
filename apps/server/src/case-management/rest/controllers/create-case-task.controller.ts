import { Body, HttpStatus, Inject, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBody, ApiResponse } from '@nestjs/swagger'
import { CreateCaseTaskUseCase } from '@hms/core/case-management/use-cases'
import type { CaseMembersRepository, CaseTasksRepository } from '@hms/core/case-management/interfaces'
import { ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import {
  CreateCaseTaskRequestDto,
  createCaseTaskSchema,
  CaseTaskResponseDto,
} from '@/case-management/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Omit<
  Parameters<CreateCaseTaskUseCase['execute']>[0],
  'caseId' | 'createdById'
>

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CreateCaseTaskController {
  private readonly useCase: CreateCaseTaskUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseTasks)
    caseTasksRepository: CaseTasksRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
    @Inject(DatetimeProvider)
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CreateCaseTaskUseCase(
      caseTasksRepository,
      caseMembersRepository,
      datetimeProvider,
    )
  }

  @Post(':caseId/tasks')
  @ApiBody({ type: CreateCaseTaskRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The case task was created.',
    type: CaseTaskResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body(new ZodValidationPipe(createCaseTaskSchema)) body: RequestBody,
    @CurrentCollaborator() collaborator: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...body,
      caseId,
      createdById: collaborator.collaboratorId,
    })
  }
}
