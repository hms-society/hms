import type { Address, TaxId } from '../structures'

type ClientBase = {
  readonly id: string
  readonly email?: string
  readonly phone?: string
  readonly address?: Address
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type NaturalClient = ClientBase & {
  readonly type: 'natural'
  readonly name: string
  readonly taxId: TaxId<'cpf'>
}

export type LegalClient = ClientBase & {
  readonly type: 'legal'
  readonly legalName: string
  readonly tradeName?: string
  readonly taxId: TaxId<'cnpj'>
}

export type Client = NaturalClient | LegalClient

export type NaturalClientCreation = Omit<NaturalClient, 'createdAt' | 'id' | 'updatedAt'>

export type LegalClientCreation = Omit<LegalClient, 'createdAt' | 'id' | 'updatedAt'>

export type ClientCreation = NaturalClientCreation | LegalClientCreation

export type ClientDetails = {
  readonly client: Client
  readonly consents: readonly import('./client-consent').ClientConsent[]
}
