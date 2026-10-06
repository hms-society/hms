import { faker } from '@faker-js/faker'
import type { CaseTask } from '../case-task'
import { CaseTaskSource, CaseTaskStatus, CaseTaskType } from '../../structures'

export class CaseTaskFaker {
  static fake(overrides: Partial<CaseTask> = {}): CaseTask {
    const createdAt = new Date('2026-10-06T12:00:00.000Z')

    return {
      id: faker.string.uuid(),
      caseId: faker.string.uuid(),
      type: CaseTaskType.InternalTask,
      description: 'Revisar documento do caso',
      plannedDate: '2026-10-20',
      status: CaseTaskStatus.ToDo,
      createdAt,
      createdById: faker.string.uuid(),
      updatedAt: createdAt,
      version: 1,
      source: CaseTaskSource.Manual,
      assigneeIds: [],
      reminders: [],
      ...overrides,
    }
  }

  static fakeMany(count = 10): CaseTask[] {
    return Array.from({ length: count }, () => CaseTaskFaker.fake())
  }
}
