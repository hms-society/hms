import { Get, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { GetLegalCaseDetailsUseCase } from '@hms/core/case-management/use-cases'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { ActiveCollaboratorGuard, AuthGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetLegalCaseDetailsController {
  private readonly useCase: GetLegalCaseDetailsUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
  ) {
    this.useCase = new GetLegalCaseDetailsUseCase(legalCasesRepository)
  }

  @Get(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The legal case details were returned successfully.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Legal case not found.',
    type: ErrorResponseDto,
  })
  handle(@Param('id') caseId: string) {
    return this.useCase.execute({ caseId })
  }
}
