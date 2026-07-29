export type ClientMatchCandidate = {
  readonly clientId: string
  readonly displayName: string
  readonly taxIdType: 'cpf' | 'cnpj'
  readonly taxId: string
  readonly phone?: string
  readonly email?: string
}
