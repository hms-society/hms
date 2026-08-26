import { faker } from '@faker-js/faker'

import type { LegalCase } from '../legal-case'
import { LegalCaseStatus } from '../../structures'

export class LegalCaseFaker {
  static fake(overrides: Partial<LegalCase> = {}): LegalCase {
    const createdAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      publicCode: `CASO-20260824-${faker.number.int({ min: 1, max: 9999 }).toString().padStart(4, '0')}`,
      clientId: faker.string.uuid(),
      intakeId: faker.string.uuid(),
      legalAreaId: faker.string.uuid(),
      legalTopicId: faker.string.uuid(),
      title: faker.lorem.sentence(),
      status: LegalCaseStatus.Documentation,
      checklistGate: {
        decision: undefined,
        decidedAt: undefined,
        decidedBy: undefined,
        remarks: undefined,
      },
      dossierGate: {
        homologatedAt: undefined,
        homologatedBy: undefined,
      },
      openedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }

  static fakeMany(count = 10): LegalCase[] {
    return Array.from({ length: count }, () => LegalCaseFaker.fake())
  }
}
