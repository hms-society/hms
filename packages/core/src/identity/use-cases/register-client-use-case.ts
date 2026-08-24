import type { Client, ClientCreation, ClientDetails } from '../domain/entities'
import { ClientAlreadyExistsError, InvalidClientDataError } from '../domain/errors'
import type { Address, TaxId } from '../domain/structures'
import type { ClientsRepository } from '../interfaces'
import type { UseCase } from '#shared/interfaces'

export type RegisterClientRequest = {
  readonly type: Client['type']
  readonly name?: string
  readonly legalName?: string
  readonly tradeName?: string
  readonly taxId: string
  readonly phone?: string
  readonly email?: string
  readonly address?: Address
}

export class RegisterClientUseCase
  implements UseCase<RegisterClientRequest, ClientDetails>
{
  constructor(private readonly clientsRepository: ClientsRepository) {}

  async execute(request: RegisterClientRequest): Promise<ClientDetails> {
    const taxId = this.parseTaxId(request.taxId, request.type)
    const clientCreation = this.createClientCreation(request, taxId)
    const existingClient = await this.clientsRepository.findByTaxId(taxId)

    if (existingClient) {
      throw new ClientAlreadyExistsError()
    }

    const client = await this.clientsRepository.add(clientCreation)

    if (!client) {
      throw new ClientAlreadyExistsError()
    }

    return { client, consents: [] }
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
      if (request.legalName?.trim() || request.tradeName?.trim()) {
        throw new InvalidClientDataError(
          'Dados de pessoa jurídica não são compatíveis com pessoa natural.',
        )
      }

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

    if (request.name?.trim()) {
      throw new InvalidClientDataError(
        'Nome de pessoa natural não é compatível com pessoa jurídica.',
      )
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

  private parseTaxId(value: string, type: Client['type']): TaxId {
    const normalizedValue = value.replace(/\D/g, '')
    const expectedLength = type === 'natural' ? 11 : 14
    const valid =
      normalizedValue.length === expectedLength &&
      !this.hasRepeatedDigits(normalizedValue) &&
      this.isValidCheckDigits(normalizedValue)

    if (!valid) {
      throw new InvalidClientDataError(
        `${type === 'natural' ? 'CPF' : 'CNPJ'} inválido para o tipo de cliente informado.`,
      )
    }

    return {
      type: type === 'natural' ? 'cpf' : 'cnpj',
      value: normalizedValue,
    }
  }

  private isValidCheckDigits(value: string) {
    const firstWeight = value.length === 11 ? 10 : 5
    const first = this.calculateCheckDigit(value.slice(0, -2), firstWeight)
    const second = this.calculateCheckDigit(value.slice(0, -1), firstWeight + 1)

    return first === Number(value.at(-2)) && second === Number(value.at(-1))
  }

  private calculateCheckDigit(value: string, initialWeight: number) {
    let weight = initialWeight
    const total = value.split('').reduce((sum, digit) => {
      const result = sum + Number(digit) * weight
      weight = weight === 2 ? 9 : weight - 1
      return result
    }, 0)

    const remainder = total % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  private hasRepeatedDigits(value: string) {
    return /^([0-9])\1+$/.test(value)
  }

  private normalizePhone(value?: string) {
    const digits = value?.replace(/\D/g, '') || ''
    const normalizedValue =
      digits.length === 11 && !digits.startsWith('55') ? `55${digits}` : digits
    return normalizedValue || undefined
  }
}
