import { Body, Inject, Param, Post } from '@nestjs/common'
import { CloseIntakeWithoutContractUseCase } from '@hms/core/intake/use-cases'
import type { IntakesRepository } from '@hms/core/intake/interfaces'

import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'

type RequestBody = Omit<
  Parameters<CloseIntakeWithoutContractUseCase['execute']>[0],
  'intakeId'
>

@IntakesController()
export class CloseIntakeWithoutContractController {
  private readonly useCase: CloseIntakeWithoutContractUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new CloseIntakeWithoutContractUseCase(
      intakesRepository,
      datetimeProvider,
    )
  }

  @Post(':intakeId/close')
  handle(@Param('intakeId') intakeId: string, @Body() body: RequestBody) {
    return this.useCase.execute({ intakeId, ...body })
  }
}
