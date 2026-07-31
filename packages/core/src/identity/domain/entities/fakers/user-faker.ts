import { faker } from '@faker-js/faker'

import type { User } from '../user'
import { UserStatusFaker } from '../../structures/fakers'

export class UserFaker {
  static fake(overrides: Partial<User> = {}): User {
    const createdAt = faker.date.past()
    const status = overrides.status ?? UserStatusFaker.fake()

    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      status,
      lastAccessAt: status === 'invited' ? undefined : faker.date.recent(),
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }

  static fakeMany(count = 10): User[] {
    return Array.from({ length: count }, () => UserFaker.fake())
  }
}
