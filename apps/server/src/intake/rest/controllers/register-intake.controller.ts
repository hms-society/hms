import { Body, Inject, Post } from '@nestjs/common'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { RegisterIntakeUseCase } from '@hms/core/intake/use-cases'

import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { IntakesController } from '@/intake/decorators'

type RequestBody = Parameters<RegisterIntakeUseCase['execute']>[0]

@IntakesController()
export class RegisterIntakesController {
  private readonly useCase: RegisterIntakeUseCase

  constructor(
    @Inject(INTAKE_REPOSITORIES.intakes) intakesRepository: IntakesRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new RegisterIntakeUseCase(intakesRepository, datetimeProvider)
  }

  @Post()
  handle(@Body() body: RequestBody) {
    return this.useCase.execute(body)
  }
}
