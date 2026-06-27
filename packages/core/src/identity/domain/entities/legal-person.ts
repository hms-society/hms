import type { Address } from '../structures/address'
import type { Person } from './person'

export type LegalPerson = Person & {
  type: 'legal'
  legalName: string
  address?: Address
}
