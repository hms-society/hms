import { faker } from '@faker-js/faker'

import { UserStatus, type UserStatus as UserStatusValue } from '../user-status'

export class UserStatusFaker {
  static fake(): UserStatusValue {
    return faker.helpers.arrayElement(Object.values(UserStatus))
  }
}
