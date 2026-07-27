import { Get, HttpStatus, Inject, Param } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { GetIntakeUseCase } from '@hms/core/intake/use-cases'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'
import { IntakeResponseDto } from '@/intake/rest/dtos/intake-response.dto'
import { ErrorResponseDto } from '@/shared/rest/dtos'

@IntakesController()
export class GetIntakesController {
  private readonly useCase: GetIntakeUseCase

  constructor(@Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository) {
    this.useCase = new GetIntakeUseCase(intakesRepository)
  }

  @Get(':intakeId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The intake was returned successfully.',
    type: IntakeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The intake was not found.',
    type: ErrorResponseDto,
  })
  handle(@Param('intakeId') intakeId: string) {
    return this.useCase.execute({ intakeId })
  }
}
