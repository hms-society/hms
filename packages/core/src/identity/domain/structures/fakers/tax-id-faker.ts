import { faker } from '@faker-js/faker'

import type { TaxId } from '../tax-id'

export class TaxIdFaker {
  static cpf(overrides: Partial<TaxId<'cpf'>> = {}): TaxId<'cpf'> {
    return { type: 'cpf', value: faker.string.numeric(11), ...overrides }
  }

  static cnpj(overrides: Partial<TaxId<'cnpj'>> = {}): TaxId<'cnpj'> {
    return { type: 'cnpj', value: faker.string.numeric(14), ...overrides }
  }
}
