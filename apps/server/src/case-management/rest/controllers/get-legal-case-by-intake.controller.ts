import { Get, HttpStatus, Param, ParseUUIDPipe, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { Response } from 'express'
import type {
  LegalCasesRepository,
  CaseMembersRepository,
} from '@hms/core/case-management/interfaces'
import { GetLegalCaseByIntakeUseCase } from '@hms/core/case-management/use-cases'
import { Inject } from '@nestjs/common'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CasesController } from '@/case-management/decorators'
import { AuthGuard, ActiveCollaboratorGuard } from '@/identity/guards'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@CasesController()
@ApiBearerAuth()
@UseGuards(AuthGuard, ActiveCollaboratorGuard)
export class GetLegalCaseByIntakeController {
  private readonly useCase: GetLegalCaseByIntakeUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
  ) {
    this.useCase = new GetLegalCaseByIntakeUseCase(
      legalCasesRepository,
      caseMembersRepository,
    )
  }

  @Get('by-intake/:intakeId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The legal case summary was returned successfully.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: ErrorResponseDto })
  handle(
    @Param('intakeId', new ParseUUIDPipe()) intakeId: string,
    @Res() response: Response,
  ) {
    return this.useCase
      .execute({ intakeId })
      .then((result) => response.status(HttpStatus.OK).json(result))
  }
}
