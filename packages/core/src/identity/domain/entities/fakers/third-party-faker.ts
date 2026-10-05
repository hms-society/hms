import { faker } from '@faker-js/faker'

import type { ThirdParty } from '../third-party'
import { TaxIdFaker } from '../../structures/fakers'

export class ThirdPartyFaker {
  static fake(overrides: Partial<ThirdParty> = {}): ThirdParty {
    return {
      id: faker.string.uuid(),
      type: 'union',
      legalName: faker.company.name(),
      taxId: TaxIdFaker.cnpj(),
      internalResponsibleId: faker.string.uuid(),
      relationshipTypes: ['demand_origin'],
      status: 'active',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    }
  }

  static fakeMany(count = 10): ThirdParty[] {
    return Array.from({ length: count }, () => ThirdPartyFaker.fake())
  }
}
