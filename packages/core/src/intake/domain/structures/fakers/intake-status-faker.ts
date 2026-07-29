import { faker } from '@faker-js/faker'

import { IntakeStatus, type IntakeStatus as IntakeStatusValue } from '../intake-status'

export class IntakeStatusFaker {
  static fake(): IntakeStatusValue {
    return faker.helpers.arrayElement(Object.values(IntakeStatus))
  }
}
