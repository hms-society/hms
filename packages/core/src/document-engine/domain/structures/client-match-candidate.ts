export type ClientMatchCandidate = {
  clientId: string
  displayName: string
  taxIdType: 'cpf' | 'cnpj'
  taxId: string
  phone?: string
  email?: string
}
