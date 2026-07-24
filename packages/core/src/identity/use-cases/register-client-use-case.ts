import type {
  Client,
  ClientConsentCreation,
  ClientCreation,
  ClientDetails,
} from '../domain/entities'
import { ClientAlreadyExistsError, InvalidClientDataError } from '../domain/errors'
import type { Address, ConsentType, TaxId } from '../domain/structures'
import type { ClientConsentsRepository, ClientsRepository } from '../interfaces'
import type { DatetimeProvider, UseCase } from '#shared/interfaces'

export type RegisterClientRequest = {
  readonly type: Client['type']
  readonly name?: string
  readonly legalName?: string
  readonly tradeName?: string
  readonly taxId: string
  readonly phone?: string
  readonly email?: string
  readonly address?: Address
  readonly consents?: readonly ConsentType[]
}

export class RegisterClientUseCase
  implements UseCase<RegisterClientRequest, ClientDetails>
{
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly clientConsentsRepository: ClientConsentsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: RegisterClientRequest): Promise<ClientDetails> {
    const taxId = this.parseTaxId(request.taxId, request.type)
    const existingClient = await this.clientsRepository.findByTaxId(taxId)

    if (existingClient) {
      throw new ClientAlreadyExistsError()
    }

    const client = await this.clientsRepository.add(
      this.createClientCreation(request, taxId),
    )
    const consents = await this.addConsents(client.id, request.consents)

    return { client, consents }
  }

  private createClientCreation(
    request: RegisterClientRequest,
    taxId: TaxId,
  ): ClientCreation {
    const common = {
      email: request.email?.trim() || undefined,
      phone: this.normalizePhone(request.phone),
      address: request.address,
      taxId,
    }

    if (request.type === 'natural') {
      if (!request.name?.trim()) {
        throw new InvalidClientDataError('Nome completo é obrigatório.')
      }

      return {
        ...common,
        type: 'natural',
        name: request.name.trim(),
        taxId: taxId as TaxId<'cpf'>,
      }
    }

    if (!request.legalName?.trim()) {
      throw new InvalidClientDataError('Razão social é obrigatória.')
    }

    return {
      ...common,
      type: 'legal',
      legalName: request.legalName.trim(),
      tradeName: request.tradeName?.trim() || undefined,
      taxId: taxId as TaxId<'cnpj'>,
    }
  }

  private async addConsents(clientId: string, consentTypes: readonly ConsentType[] = []) {
    const uniqueConsentTypes = [...new Set(consentTypes)]
    if (uniqueConsentTypes.length === 0) return []

    const consents: ClientConsentCreation[] = uniqueConsentTypes.map((type) => ({
      clientId,
      type,
      grantedAt: this.datetimeProvider.now(),
    }))

    return this.clientConsentsRepository.addMany(consents)
  }

  private parseTaxId(value: string, type: Client['type']): TaxId {
    const normalizedValue = value.replace(/\D/g, '')
    const expectedLength = type === 'natural' ? 11 : 14

    if (normalizedValue.length !== expectedLength) {
      throw new InvalidClientDataError(
        `${type === 'natural' ? 'CPF' : 'CNPJ'} inválido para o tipo de cliente informado.`,
      )
    }

    return {
      type: type === 'natural' ? 'cpf' : 'cnpj',
      value: normalizedValue,
    }
  }

  private normalizePhone(value?: string) {
    const normalizedValue = value?.replace(/\D/g, '')
    return normalizedValue || undefined
  }
}
