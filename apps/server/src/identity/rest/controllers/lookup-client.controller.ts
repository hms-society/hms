import { Body, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common'
import type {
  ClientConsentsRepository,
  ClientsRepository,
} from '@hms/core/identity/interfaces'
import { LookupClientUseCase } from '@hms/core/identity/use-cases'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { ClientsController } from '@/identity/decorators'

type RequestBody = Parameters<LookupClientUseCase['execute']>[0]

@ClientsController()
export class LookupClientController {
  private readonly useCase: LookupClientUseCase

  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    clientsRepository: ClientsRepository,
    @Inject(IDENTITY_REPOSITORIES.clientConsents)
    clientConsentsRepository: ClientConsentsRepository,
  ) {
    this.useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)
  }

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  handle(@Body() body: RequestBody) {
    return this.useCase.execute(body)
  }
}
