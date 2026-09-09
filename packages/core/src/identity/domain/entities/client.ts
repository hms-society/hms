import type { ClientConsent } from './client-consent'
import type { Address, TaxId } from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

type ClientBase = Entity & {
  email?: string
  phone?: string
  address?: Address
  createdAt: Date
  updatedAt: Date
}

export type NaturalClient = ClientBase & {
  type: 'natural'
  name: string
  taxId: TaxId<'cpf'>
}

export type LegalClient = ClientBase & {
  type: 'legal'
  legalName: string
  tradeName?: string
  taxId: TaxId<'cnpj'>
}

export type Client = NaturalClient | LegalClient

export type NaturalClientCreation = Omit<NaturalClient, 'createdAt' | 'id' | 'updatedAt'>

export type LegalClientCreation = Omit<LegalClient, 'createdAt' | 'id' | 'updatedAt'>

export type ClientCreation = NaturalClientCreation | LegalClientCreation

export type ClientDetails = {
  readonly client: Client
  readonly consents: readonly ClientConsent[]
}
