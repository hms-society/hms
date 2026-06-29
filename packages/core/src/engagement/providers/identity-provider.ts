export type EnsurePersonInput = {
  documentIdNumber: string
  name: string
  email?: string
  phone?: string
}

export type PersonSummary = {
  personId: string
  name: string
  email?: string
  phone?: string
}

export interface IdentityProvider {
  ensurePerson(input: EnsurePersonInput): Promise<{ personId: string }>
  getPersonSummary(personId: string): Promise<PersonSummary>
}
