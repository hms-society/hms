import { faker } from '@faker-js/faker'
import type { DynamicFormSnapshot } from '../dynamic-form-snapshot'

export function fakeDynamicFormSnapshot(
  overrides: Partial<DynamicFormSnapshot> = {},
): DynamicFormSnapshot {
  const fieldId = faker.string.uuid()
  return {
    dynamicFormId: faker.string.uuid(),
    name: 'Condições comerciais',
    fields: [
      {
        id: fieldId,
        key: 'client_name',
        label: 'Nome do cliente',
        type: 'short_text',
        position: 0,
        required: true,
      },
    ],
    ...overrides,
  }
}
