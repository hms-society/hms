import { Body, Inject, Post } from '@nestjs/common'
import type {
  ClientConsentsRepository,
  ClientsRepository,
} from '@hms/core/identity/interfaces'
import { RegisterClientUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController } from '@/identity/decorators'
import { DatetimeProvider } from '@/shared/provision/datetime/datetime-provider'

type RequestBody = Parameters<RegisterClientUseCase['execute']>[0]

@ClientsController()
export class RegisterClientController {
  private readonly useCase: RegisterClientUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.clientConsents)
    clientConsentsRepository: ClientConsentsRepository,
    datetimeProvider: DatetimeProvider,
  ) {
    this.useCase = new RegisterClientUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )
  }

  @Post()
  handle(@Body() body: RequestBody) {
    return this.useCase.execute(body)
  }
}
