import { faker } from '@faker-js/faker'

import {
  IntakeClosureReason,
  type IntakeClosureReason as IntakeClosureReasonValue,
} from '../intake-closure-reason'

export class IntakeClosureReasonFaker {
  static fake(): IntakeClosureReasonValue {
    return faker.helpers.arrayElement(Object.values(IntakeClosureReason))
  }
}
