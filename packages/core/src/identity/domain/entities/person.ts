import type { PersonConsent } from '../structures/person-content'
import type { PersonType } from '../structures/person-type'

export type Person = {
  id: string
  type: PersonType
  documentIdNumber: string
  email?: string
  phone?: string
  consents: PersonConsent[]
  createdAt: Date
  updatedAt: Date
}
