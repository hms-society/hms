import { Body, Inject, Param, Patch } from '@nestjs/common'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { TransitionIntakeStatusUseCase } from '@hms/core/intake/use-cases'

import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'

type RequestBody = Omit<
  Parameters<TransitionIntakeStatusUseCase['execute']>[0],
  'intakeId'
>

@IntakesController()
export class TransitionIntakeStatusController {
  private readonly useCase: TransitionIntakeStatusUseCase

  constructor(@Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository) {
    this.useCase = new TransitionIntakeStatusUseCase(intakesRepository)
  }

  @Patch(':intakeId/status')
  handle(@Param('intakeId') intakeId: string, @Body() body: RequestBody) {
    return this.useCase.execute({ intakeId, ...body })
  }
}
