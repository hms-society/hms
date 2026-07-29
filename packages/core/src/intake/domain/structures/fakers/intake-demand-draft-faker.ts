import { faker } from '@faker-js/faker'

import type { IntakeDemandDraft } from '../intake-demand-draft'
import { ContactChannelFaker } from './contact-channel-faker'
import { IntakeOriginFaker } from './intake-origin-faker'
import { IntakeUrgencyFaker } from './intake-urgency-faker'

export class IntakeDemandDraftFaker {
  static fake(overrides: Partial<IntakeDemandDraft> = {}): IntakeDemandDraft {
    return {
      origin: IntakeOriginFaker.fake(),
      contactChannel: ContactChannelFaker.fake(),
      legalArea: faker.lorem.words(2),
      legalTopic: faker.lorem.words(3),
      urgency: IntakeUrgencyFaker.fake(),
      notes: faker.lorem.sentence(),
      ...overrides,
    }
  }
}
