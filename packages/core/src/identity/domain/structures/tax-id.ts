export const TaxIdType = {
  Cpf: 'cpf',
  Cnpj: 'cnpj',
} as const

type TaxIdType = (typeof TaxIdType)[keyof typeof TaxIdType]

export type TaxId<TType extends TaxIdType = TaxIdType> = {
  type: TType
  value: string
}
