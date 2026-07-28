import { Get, HttpStatus, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { ListClientIntakesUseCase } from '@hms/core/intake/use-cases'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'
import { IntakeResponseDto } from '@/intake/rest/dtos/intake-response.dto'
import { AuthGuard } from '@/identity/guards'

@IntakesController()
@UseGuards(AuthGuard)
export class ListClientIntakesController {
  private readonly useCase: ListClientIntakesUseCase

  constructor(@Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository) {
    this.useCase = new ListClientIntakesUseCase(intakesRepository)
  }

  @Get('clients/:clientId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The client intakes were returned successfully.',
    type: [IntakeResponseDto],
  })
  handle(@Param('clientId') clientId: string) {
    return this.useCase.execute({ clientId })
  }
}
