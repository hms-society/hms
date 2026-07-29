import { faker } from '@faker-js/faker'

import { IntakeOrigin, type IntakeOrigin as IntakeOriginValue } from '../intake-origin'

export class IntakeOriginFaker {
  static fake(): IntakeOriginValue {
    return faker.helpers.arrayElement(Object.values(IntakeOrigin))
  }
}
