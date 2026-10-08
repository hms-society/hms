import { faker } from '@faker-js/faker'
import type { CaseMember } from '../case-member'
import { CaseMemberRole } from '../../structures'

export class CaseMemberFaker {
  static fake(overrides: Partial<CaseMember> = {}): CaseMember {
    const assignedAt = faker.date.past()

    return {
      id: faker.string.uuid(),
      caseId: faker.string.uuid(),
      collaboratorId: faker.string.uuid(),
      role: CaseMemberRole.Lawyer,
      assignedAt,
      assignedBy: faker.string.uuid(),
      archivedLegacy: false,
      createdAt: assignedAt,
      ...overrides,
    }
  }

  static fakeMany(count = 10): CaseMember[] {
    return Array.from({ length: count }, () => CaseMemberFaker.fake())
  }
}
