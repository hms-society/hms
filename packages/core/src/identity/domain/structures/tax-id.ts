export const TaxIdType = {
  Cpf: 'cpf',
  Cnpj: 'cnpj',
  OfficialRegistration: 'official_registration',
  OtherNationalDocument: 'other_national_document',
} as const

type TaxIdType = (typeof TaxIdType)[keyof typeof TaxIdType]

export type TaxId<TType extends TaxIdType = TaxIdType> = {
  readonly type: TType
  readonly value: string
  readonly description?: string
}
