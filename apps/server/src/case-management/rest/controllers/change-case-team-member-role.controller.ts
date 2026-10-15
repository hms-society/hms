import {
  Body,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { changeCaseTeamMemberRoleSchema } from '@hms/validation/case-management'
import { ChangeCaseTeamMemberRoleUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseIdentityTransaction,
  DatetimeProvider as DatetimeProviderContract,
} from '@hms/core/shared/interfaces'
import { CASE_IDENTITY_TRANSACTION } from '@/shared/database/constants/case-identity-transaction'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'
import { ZodValidationPipe } from 'nestjs-zod'

type RequestBody = Omit<
  Parameters<ChangeCaseTeamMemberRoleUseCase['execute']>[0],
  'caseId' | 'actorId' | 'membershipId'
>

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ChangeCaseTeamMemberRoleController {
  private readonly useCase: ChangeCaseTeamMemberRoleUseCase
  constructor(
    @Inject(CASE_IDENTITY_TRANSACTION) transaction: CaseIdentityTransaction,
    @Inject(DatetimeProvider) datetime: DatetimeProviderContract,
  ) {
    this.useCase = new ChangeCaseTeamMemberRoleUseCase(transaction, datetime)
  }

  @Patch(':caseId/team/:membershipId/role')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team member role updated.',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
    @Param('membershipId', new ParseUUIDPipe()) membershipId: string,
    @Body(new ZodValidationPipe(changeCaseTeamMemberRoleSchema)) body: RequestBody,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    return this.useCase.execute({
      ...body,
      caseId,
      membershipId,
      actorId: actor.collaboratorId,
    })
  }
}
