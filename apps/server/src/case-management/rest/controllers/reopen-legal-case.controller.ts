import {
  Body,
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
import { ReopenLegalCaseUseCase } from '@hms/core/case-management/use-cases'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ZodValidationPipe } from 'nestjs-zod'

import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { reopenCaseRequestSchema } from '@/case-management/rest/dtos/case-closure-request.dto'
import { LegalCaseResponseDto } from '@/case-management/rest/dtos/legal-case-response.dto'
import { CurrentCollaborator } from '@/identity/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { ErrorResponseDto } from '@/shared/rest/dtos'

type RequestBody = Parameters<ReopenLegalCaseUseCase['execute']>[0]
type ReopenBody = Omit<RequestBody, 'actorId' | 'caseId'>

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ReopenLegalCaseController {
  private readonly useCase: ReopenLegalCaseUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseClosure)
    closureRepository: CaseClosureRepository,
    @Inject(CASE_MANAGEMENT_PROVIDERS.caseClosureAccess)
    accessProvider: CaseClosureAccessProvider,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new ReopenLegalCaseUseCase(
      closureRepository,
      accessProvider,
      datetimeProvider,
    )
  }

  @Post(':caseId/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The closed case was reopened.',
    type: LegalCaseResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body(new ZodValidationPipe(reopenCaseRequestSchema)) body: ReopenBody,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    return this.useCase.execute({ ...body, caseId, actorId: actor.collaboratorId })
  }
}
