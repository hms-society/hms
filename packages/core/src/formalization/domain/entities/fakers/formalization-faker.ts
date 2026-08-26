import { faker } from '@faker-js/faker'
import type { Formalization } from '../formalization'
import { fakeDynamicFormSnapshot } from '../../../../shared/domain/structures/fakers'

export function fakeFormalization(overrides: Partial<Formalization> = {}): Formalization {
  const now = new Date('2026-08-24T12:00:00.000Z')
  return {
    id: faker.string.uuid(),
    intakeId: faker.string.uuid(),
    clientId: faker.string.uuid(),
    consultationId: faker.string.uuid(),
    assignedLawyerId: faker.string.uuid(),
    status: 'in_progress',
    contractFormId: faker.string.uuid(),
    contractFormSnapshot: fakeDynamicFormSnapshot(),
    contractFormAnswers: [],
    contractFormState: 'open',
    contractFormRevision: 0,
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
