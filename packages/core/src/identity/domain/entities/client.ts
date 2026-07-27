import type { Address, TaxId } from '../structures'

type ClientBase = {
  id: string
  email?: string
  phone: string
  address?: Address
  createdAt: Date
  updatedAt: Date
}

type NaturalClient = ClientBase & {
  type: 'natural'
  name: string
  taxId: TaxId<'cpf'>
}

type LegalClient = ClientBase & {
  type: 'legal'
  legalName: string
  tradeName?: string
  taxId: TaxId<'cnpj'>
}

export type Client = NaturalClient | LegalClient
