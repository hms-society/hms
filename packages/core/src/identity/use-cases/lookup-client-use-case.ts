import type { ClientDetails } from '../domain/entities'
import {
  AmbiguousClientLookupError,
  ClientNotFoundError,
  InvalidClientDataError,
} from '../domain/errors'
import type { TaxId } from '../domain/structures'
import type { ClientConsentsRepository, ClientsRepository } from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

export type LookupClientRequest = {
  readonly taxId?: string
  readonly phone?: string
}

export class LookupClientUseCase implements UseCase<LookupClientRequest, ClientDetails> {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly clientConsentsRepository: ClientConsentsRepository,
  ) {}

  async execute(request: LookupClientRequest): Promise<ClientDetails> {
    const taxId = request.taxId ? this.parseTaxId(request.taxId) : undefined
    const phone = this.normalizePhone(request.phone)

    if (!taxId && !phone) {
      throw new InvalidClientDataError(
        'Informe CPF, CNPJ ou telefone para realizar a busca.',
      )
    }

    let client = taxId ? await this.clientsRepository.findByTaxId(taxId) : undefined

    if (!client && !taxId && phone) {
      const clients = await this.clientsRepository.findByPhone(phone)

      if (clients.length > 1) {
        throw new AmbiguousClientLookupError()
      }

      client = clients[0]
    }

    if (!client) {
      throw new ClientNotFoundError()
    }

    return {
      client,
      consents: await this.clientConsentsRepository.findByClientId(client.id),
    }
  }

  private parseTaxId(value: string): TaxId {
    const normalizedValue = value.replace(/\D/g, '')

    if (normalizedValue.length === 11) {
      return { type: 'cpf', value: normalizedValue }
    }

    if (normalizedValue.length === 14) {
      return { type: 'cnpj', value: normalizedValue }
    }

    throw new InvalidClientDataError('CPF ou CNPJ inválido.')
  }

  private normalizePhone(value?: string) {
    const normalizedValue = value?.replace(/\D/g, '')
    return normalizedValue || undefined
  }
}
