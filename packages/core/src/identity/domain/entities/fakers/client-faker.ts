import { faker } from '@faker-js/faker'

import { TaxIdFaker } from '../../structures/fakers'
import type { Client, LegalClient, NaturalClient } from '../client'

export class ClientFaker {
  static fake(overrides: Partial<NaturalClient> = {}): NaturalClient {
    const createdAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      type: 'natural',
      name: faker.person.fullName(),
      taxId: TaxIdFaker.cpf(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }

  static legal(overrides: Partial<LegalClient> = {}): LegalClient {
    const createdAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      type: 'legal',
      legalName: faker.company.name(),
      tradeName: faker.company.name(),
      taxId: TaxIdFaker.cnpj(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }

  static fakeMany(count = 10): Client[] {
    return Array.from({ length: count }, () => ClientFaker.fake())
  }
}
