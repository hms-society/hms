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

    if (
      normalizedValue.length === 11 &&
      !this.hasRepeatedDigits(normalizedValue) &&
      this.isValidCheckDigits(normalizedValue)
    ) {
      return { type: 'cpf', value: normalizedValue }
    }

    if (
      normalizedValue.length === 14 &&
      !this.hasRepeatedDigits(normalizedValue) &&
      this.isValidCheckDigits(normalizedValue)
    ) {
      return { type: 'cnpj', value: normalizedValue }
    }

    throw new InvalidClientDataError('CPF ou CNPJ inválido.')
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
    const normalizedValue = value?.replace(/\D/g, '')
    return normalizedValue || undefined
  }
}
