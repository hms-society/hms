import type { RelationalStatus } from '../structures'
import type { PersonConsent } from '../structures/person-content'
import type { PersonType } from '../structures/person-type'

export type Person = {
  id: string
  type: PersonType
  documentIdNumber?: string
  email?: string
  phone?: string
  consents: PersonConsent[]
  relationalStatus: RelationalStatus
  createdAt: Date
  updatedAt: Date
}
