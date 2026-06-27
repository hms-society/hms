import type { Address } from '../structures/address'
import type { Person } from './person'

export type NaturalPerson = Person & {
  type: 'natural'
  name: string
  address?: Address
}
