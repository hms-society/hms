import { Get, Inject, Param } from '@nestjs/common'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { GetIntakeUseCase } from '@hms/core/intake/use-cases'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'

@IntakesController()
export class GetIntakesController {
  private readonly useCase: GetIntakeUseCase

  constructor(@Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository) {
    this.useCase = new GetIntakeUseCase(intakesRepository)
  }

  @Get(':intakeId')
  handle(@Param('intakeId') intakeId: string) {
    return this.useCase.execute({ intakeId })
  }
}
