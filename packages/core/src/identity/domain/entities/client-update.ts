import type { Address, TaxId } from '../structures'

export type NaturalClientUpdate = {
  readonly type?: 'natural'
  readonly name?: string
  readonly taxId?: TaxId<'cpf'>
  readonly email?: string
  readonly phone?: string
  readonly address?: Address
}

export type LegalClientUpdate = {
  readonly type?: 'legal'
  readonly legalName?: string
  readonly tradeName?: string
  readonly taxId?: TaxId<'cnpj'>
  readonly email?: string
  readonly phone?: string
  readonly address?: Address
}

export type ClientUpdate = NaturalClientUpdate | LegalClientUpdate
