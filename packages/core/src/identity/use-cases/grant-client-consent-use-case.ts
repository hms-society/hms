import type { ClientConsent, ClientConsentCreation } from '../domain/entities'
import {
  ClientConsentAlreadyGrantedError,
  ClientNotFoundError,
} from '../domain/errors'
import type { ConsentType } from '../domain/structures'
import type { ClientConsentsRepository, ClientsRepository } from '../interfaces'
import type { DatetimeProvider, UseCase } from '#shared/interfaces'

export type GrantClientConsentRequest = {
  readonly clientId: string
  readonly type: ConsentType
}

export class GrantClientConsentUseCase
  implements UseCase<GrantClientConsentRequest, ClientConsent>
{
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly clientConsentsRepository: ClientConsentsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute({ clientId, type }: GrantClientConsentRequest): Promise<ClientConsent> {
    const client = await this.clientsRepository.findById(clientId)

    if (!client) {
      throw new ClientNotFoundError()
    }

    const activeConsent = await this.clientConsentsRepository.findActiveByClientIdAndType(
      client.id,
      type,
    )

    if (activeConsent) {
      throw new ClientConsentAlreadyGrantedError(type)
    }

    const createdConsent = await this.clientConsentsRepository.add({
      clientId: client.id,
      type,
      grantedAt: this.datetimeProvider.now(),
    } satisfies ClientConsentCreation)

    if (!createdConsent) {
      throw new ClientConsentAlreadyGrantedError(type)
    }

    return createdConsent
  }
}
