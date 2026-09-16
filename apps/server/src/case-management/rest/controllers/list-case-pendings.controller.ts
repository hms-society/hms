import { Get, HttpStatus, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ListCasePendingsUseCase } from '@hms/core/case-management/use-cases'
import type { PendingsRepository } from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { PendingResponseDto } from '@/case-management/rest/dtos'

@CasesController()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class ListCasePendingsController {
  private readonly useCase: ListCasePendingsUseCase

  constructor(@Inject(CASE_MANAGEMENT_REPOSITORIES.pendings) repository: PendingsRepository) {
    this.useCase = new ListCasePendingsUseCase(repository)
  }

  @Get(':caseId/pendencies')
  @ApiResponse({ status: HttpStatus.OK, type: [PendingResponseDto] })
  handle(@Param('caseId', new ParseUUIDPipe()) caseId: string) {
    return this.useCase.execute(caseId)
  }
}
