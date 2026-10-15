import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { addCaseTeamMemberSchema } from '@hms/validation/case-management'
import { AddCaseTeamMemberUseCase } from '@hms/core/case-management/use-cases'
import type { CaseIdentityTransaction } from '@hms/core/shared/interfaces'
import { CASE_IDENTITY_TRANSACTION } from '@/shared/database/constants/case-identity-transaction'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import type { DatetimeProvider as DatetimeProviderContract } from '@hms/core/shared/interfaces'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from 'nestjs-zod'

type RequestBody = Omit<
  Parameters<AddCaseTeamMemberUseCase['execute']>[0],
  'caseId' | 'actorId'
>

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class AddCaseTeamMemberController {
  private readonly useCase: AddCaseTeamMemberUseCase
  constructor(
    @Inject(CASE_IDENTITY_TRANSACTION) transaction: CaseIdentityTransaction,
    @Inject(DatetimeProvider) datetime: DatetimeProviderContract,
  ) {
    this.useCase = new AddCaseTeamMemberUseCase(transaction, datetime)
  }

  @Post(':caseId/team')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Team member added or reinstated.',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Body(new ZodValidationPipe(addCaseTeamMemberSchema)) body: RequestBody,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    return this.useCase.execute({ ...body, caseId, actorId: actor.collaboratorId })
  }
}
