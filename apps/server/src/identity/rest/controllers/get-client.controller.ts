import { Get, Inject, Param } from '@nestjs/common'
import type {
  ClientConsentsRepository,
  ClientsRepository,
} from '@hms/core/identity/interfaces'
import { GetClientUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController } from '@/identity/decorators'

@ClientsController()
export class GetClientController {
  private readonly useCase: GetClientUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.clientConsents)
    clientConsentsRepository: ClientConsentsRepository,
  ) {
    this.useCase = new GetClientUseCase(clientsRepository, clientConsentsRepository)
  }

  @Get(':clientId')
  handle(@Param('clientId') clientId: string) {
    return this.useCase.execute({ clientId })
  }
}
