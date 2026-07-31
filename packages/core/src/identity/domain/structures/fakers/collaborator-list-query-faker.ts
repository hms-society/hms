import { faker } from '@faker-js/faker'

import type { CollaboratorListQuery } from '../collaborator-list-query'
import { CollaboratorProfileFaker } from './collaborator-profile-faker'
import { UserStatusFaker } from './user-status-faker'

export class CollaboratorListQueryFaker {
  static fake(overrides: Partial<CollaboratorListQuery> = {}): CollaboratorListQuery {
    return {
      search: faker.person.firstName(),
      profile: CollaboratorProfileFaker.fake(),
      jobTitle: faker.person.jobTitle(),
      status: UserStatusFaker.fake(),
      page: 1,
      pageSize: 20,
      ...overrides,
    }
  }
}
