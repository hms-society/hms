import { faker } from '@faker-js/faker'
import type { CaseChecklistItem } from '../case-checklist-item'
import { CaseChecklistItemStatus } from '../../structures'
export class CaseChecklistItemFaker {
  static fake(overrides: Partial<CaseChecklistItem> = {}): CaseChecklistItem {
    const createdAt = faker.date.past()
    return {
      id: faker.string.uuid(),
      caseId: faker.string.uuid(),
      templateItemKey: faker.string.uuid(),
      title: faker.lorem.words(3),
      isRequired: true,
      status: CaseChecklistItemStatus.Pending,
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }
  static fakeMany(count = 10): CaseChecklistItem[] {
    return Array.from({ length: count }, () => CaseChecklistItemFaker.fake())
  }
}
