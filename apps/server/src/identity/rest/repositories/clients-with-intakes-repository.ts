import { Inject, Injectable } from '@nestjs/common'
import type { ClientsRepository } from '@hms/core/identity/interfaces'
import type { IntakesRepository } from '@hms/core/intake/interfaces'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'

@Injectable()
export class ClientsWithIntakesRepository implements ClientsRepository {
  constructor(
    @Inject(IDENTITY_REPOSITORIES.clients)
    private readonly clientsRepository: ClientsRepository,
    @Inject(INTAKE_REPOSITORIES.intakes)
    private readonly intakesRepository: IntakesRepository,
  ) {}

  add(...args: Parameters<ClientsRepository['add']>) {
    return this.clientsRepository.add(...args)
  }

  addMany(...args: Parameters<ClientsRepository['addMany']>) {
    return this.clientsRepository.addMany(...args)
  }

  removeAll() {
    return this.clientsRepository.removeAll()
  }

  findById(...args: Parameters<ClientsRepository['findById']>) {
    return this.clientsRepository.findById(...args)
  }

  findByTaxId(...args: Parameters<ClientsRepository['findByTaxId']>) {
    return this.clientsRepository.findByTaxId(...args)
  }

  findByPhone(...args: Parameters<ClientsRepository['findByPhone']>) {
    return this.clientsRepository.findByPhone(...args)
  }

  async findAll(...args: Parameters<ClientsRepository['findAll']>) {
    const result = await this.clientsRepository.findAll(...args)
    const data = await Promise.all(
      result.data.map(async ({ client }) => {
        const intakes = await this.intakesRepository.findByClientId(client.id)
        return {
          client,
          intakeCount: intakes.length,
          latestOrigin: intakes[0]?.origin ?? null,
        }
      }),
    )

    return { data, total: result.total }
  }
}
