import { Inject, Injectable } from '@nestjs/common'
import type { ClientCreation } from '@hms/core/identity/domain/entities'
import type { ClientsRepository } from '@hms/core/identity/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'

@Injectable()
export class IdentitySeeder {
  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
  ) {}

  seed(clients: ClientCreation[]) {
    return this.clientsRepository.addMany(clients)
  }
}
