import { faker } from '@faker-js/faker'

import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../collaborator-profile'

export class CollaboratorProfileFaker {
  static fake(): CollaboratorProfileValue {
    return faker.helpers.arrayElement(Object.values(CollaboratorProfile))
  }
}
