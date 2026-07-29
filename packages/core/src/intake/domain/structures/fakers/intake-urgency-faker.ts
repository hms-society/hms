import { faker } from '@faker-js/faker'

import {
  IntakeUrgency,
  type IntakeUrgency as IntakeUrgencyValue,
} from '../intake-urgency'

export class IntakeUrgencyFaker {
  static fake(): IntakeUrgencyValue {
    return faker.helpers.arrayElement(Object.values(IntakeUrgency))
  }
}
