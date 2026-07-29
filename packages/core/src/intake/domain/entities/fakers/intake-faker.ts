import { faker } from '@faker-js/faker'

import type { Intake } from '../intake'
import {
  ContactChannelFaker,
  IntakeClosureReasonFaker,
  IntakeOriginFaker,
  IntakeStatusFaker,
  IntakeUrgencyFaker,
} from '../../structures/fakers'
import { IntakeClosureReason, IntakeStatus } from '../../structures'

export class IntakeFaker {
  static fake(overrides: Partial<Intake> = {}): Intake {
    const createdAt = faker.date.past()
    const status = IntakeStatusFaker.fake()
    const closureReason =
      status === IntakeStatus.ClosedWithoutContract
        ? IntakeClosureReasonFaker.fake()
        : undefined

    return {
      id: faker.string.uuid(),
      sequenceNumber: faker.number.int({ min: 1, max: 999999 }),
      clientId: faker.string.uuid(),
      responsibleId: faker.string.uuid(),
      createdBy: faker.string.uuid(),
      updatedBy: faker.string.uuid(),
      origin: IntakeOriginFaker.fake(),
      contactChannel: ContactChannelFaker.fake(),
      legalAreaId: faker.string.uuid(),
      legalTopicId: faker.string.uuid(),
      urgency: IntakeUrgencyFaker.fake(),
      demandNotes: faker.lorem.sentence(),
      status,
      closureReason,
      closureNotes:
        closureReason === IntakeClosureReason.Other ? faker.lorem.sentence() : undefined,
      closedAt: status === IntakeStatus.ClosedWithoutContract ? createdAt : undefined,
      version: faker.number.int({ min: 1, max: 10 }),
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    }
  }

  static fakeMany(count = 10): Intake[] {
    return Array.from({ length: count }, () => IntakeFaker.fake())
  }
}
