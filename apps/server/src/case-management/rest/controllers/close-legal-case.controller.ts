import {
  Body,
  ConflictException,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type {
  CaseClosureAccessProvider,
  CaseClosureRepository,
} from '@hms/core/case-management/interfaces'
import { CloseLegalCaseUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { CloseCaseResponseDto, closeCaseRequestSchema } from '@/case-management/rest/dtos'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Parameters<CloseLegalCaseUseCase['execute']>[0]
type CloseBody = Omit<RequestBody, 'actorId' | 'caseId'>

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class CloseLegalCaseController {
  private readonly useCase: CloseLegalCaseUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseClosure)
    closureRepository: CaseClosureRepository,
    @Inject(CASE_MANAGEMENT_PROVIDERS.caseClosureAccess)
    accessProvider: CaseClosureAccessProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CloseLegalCaseUseCase(
      closureRepository,
      accessProvider,
      datetimeProvider,
    )
  }

  @Post(':caseId/close')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The case was closed, or the current blockers were returned.',
    type: CloseCaseResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  async handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body(new ZodValidationPipe(closeCaseRequestSchema)) body: CloseBody,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    const result = await this.useCase.execute({
      ...body,
      caseId,
      actorId: actor.collaboratorId,
    })
    if (result.kind === 'conflict') {
      throw new ConflictException(
        'O caso mudou durante o encerramento. Atualize e tente novamente.',
      )
    }
    return result
  }
}
