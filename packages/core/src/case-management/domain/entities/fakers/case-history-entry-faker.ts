import { faker } from '@faker-js/faker'
import type { CaseHistoryEntry } from '../case-history-entry'
import { CaseHistoryKind, CaseHistoryCategory } from '../../structures'
export class CaseHistoryEntryFaker {
  static fake(overrides: Partial<CaseHistoryEntry> = {}): CaseHistoryEntry {
    return {
      id: `record:${faker.string.uuid()}`,
      caseId: faker.string.uuid(),
      kind: CaseHistoryKind.ManualUpdate,
      category: CaseHistoryCategory.Manual,
      occurredAt: new Date('2026-10-10T12:00:00.000Z'),
      recordedAt: new Date('2026-10-13T12:00:00.000Z'),
      actorId: faker.string.uuid(),
      title: 'Andamento registrado',
      description: faker.lorem.sentence(),
      documents: [],
      ...overrides,
    }
  }
  static fakeMany(count = 10): CaseHistoryEntry[] {
    return Array.from({ length: count }, () => CaseHistoryEntryFaker.fake())
  }
}
