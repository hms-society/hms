import { faker } from '@faker-js/faker'

import type { Schedule } from '../schedule'

export class ScheduleFaker {
  static fake(overrides: Partial<Schedule> = {}): Schedule {
    return {
      id: faker.string.uuid(),
      collaboratorId: faker.string.uuid(),
      timeZone: 'America/Sao_Paulo',
      appointmentDurationInMinutes: 45,
      weeklyAvailability: [],
      blockedPeriods: [],
      createdAt: new Date('2026-08-12T15:00:00.000Z'),
      updatedAt: new Date('2026-08-12T15:00:00.000Z'),
      ...overrides,
    }
  }
}
