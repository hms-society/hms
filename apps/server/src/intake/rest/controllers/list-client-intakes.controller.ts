import { Get, Inject, Param } from '@nestjs/common'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { ListClientIntakesUseCase } from '@hms/core/intake/use-cases'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'

@IntakesController()
export class ListClientIntakesController {
  private readonly useCase: ListClientIntakesUseCase

  constructor(@Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository) {
    this.useCase = new ListClientIntakesUseCase(intakesRepository)
  }

  @Get('clients/:clientId')
  handle(@Param('clientId') clientId: string) {
    return this.useCase.execute({ clientId })
  }
}
