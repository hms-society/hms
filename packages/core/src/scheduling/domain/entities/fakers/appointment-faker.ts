import { faker } from '@faker-js/faker'

import type { Appointment } from '../appointment'

export class AppointmentFaker {
  static fake(overrides: Partial<Appointment> = {}): Appointment {
    const startsAt = new Date('2026-08-13T13:00:00.000Z')

    return {
      id: faker.string.uuid(),
      intakeId: faker.string.uuid(),
      scheduleId: faker.string.uuid(),
      clientId: faker.string.uuid(),
      startsAt,
      endsAt: new Date('2026-08-13T13:45:00.000Z'),
      status: 'scheduled',
      createdAt: new Date('2026-08-12T15:00:00.000Z'),
      updatedAt: new Date('2026-08-12T15:00:00.000Z'),
      ...overrides,
    }
  }
}
