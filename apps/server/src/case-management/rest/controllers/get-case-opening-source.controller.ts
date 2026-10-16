import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { GetCaseOpeningSourceUseCase } from '@hms/core/case-management/use-cases'
import type {
  CaseCollaboratorsProvider,
  CaseOpeningSourceProvider,
} from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { CasesController } from '@/case-management/decorators'
import { CurrentCollaborator } from '@/identity/decorators'
import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetCaseOpeningSourceController {
  private readonly useCase: GetCaseOpeningSourceUseCase
  constructor(
    @Inject(CASE_MANAGEMENT_PROVIDERS.openingSource) source: CaseOpeningSourceProvider,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    collaborators: CaseCollaboratorsProvider,
  ) {
    this.useCase = new GetCaseOpeningSourceUseCase(source, collaborators)
  }

  @Get('opening-sources/:intakeId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available Intake references and eligible suggested Lawyer.',
    type: Object,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: ErrorResponseDto })
  handle(
    @Param('intakeId', new ParseUUIDPipe()) intakeId: string,
    @CurrentCollaborator() actor: CollaboratorSummary,
  ) {
    return this.useCase.execute({ intakeId, actorId: actor.collaboratorId })
  }
}
