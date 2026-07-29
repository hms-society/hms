import type { ClientDetails } from '../domain/entities'
import { ClientNotFoundError } from '../domain/errors'
import type { ClientConsentsRepository, ClientsRepository } from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

export type GetClientRequest = {
  readonly clientId: string
}

export class GetClientUseCase implements UseCase<GetClientRequest, ClientDetails> {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly clientConsentsRepository: ClientConsentsRepository,
  ) {}

  async execute({ clientId }: GetClientRequest): Promise<ClientDetails> {
    const client = await this.clientsRepository.findById(clientId)

    if (!client) {
      throw new ClientNotFoundError()
    }

    return {
      client,
      consents: await this.clientConsentsRepository.findByClientId(client.id),
    }
  }
}
