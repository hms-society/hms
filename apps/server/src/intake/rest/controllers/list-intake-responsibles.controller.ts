import { Get, HttpStatus, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import type { IntakeResponsiblesRepository } from '@hms/core/identity/interfaces'
import { ListIntakeResponsiblesUseCase } from '@hms/core/intake/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { AuthGuard } from '@/identity/guards'
import { IntakesController } from '@/intake/decorators'
import { IntakeListResponsibleResponseDto } from '@/intake/rest/dtos'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@IntakesController()
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class ListIntakeResponsiblesController {
  private readonly useCase: ListIntakeResponsiblesUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.intakeResponsibles)
    intakeResponsiblesRepository: IntakeResponsiblesRepository,
  ) {
    this.useCase = new ListIntakeResponsiblesUseCase(intakeResponsiblesRepository)
  }

  @Get('responsibles')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The intake responsible options were returned successfully.',
    type: [IntakeListResponsibleResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication is required.',
    type: ErrorResponseDto,
  })
  handle() {
    return this.useCase.execute()
  }
}
