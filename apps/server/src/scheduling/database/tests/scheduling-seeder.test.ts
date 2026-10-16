import type { Appointment } from '@hms/core/scheduling/domain/entities'
import type { Schedule } from '@hms/core/scheduling/domain/entities'
import { describe, expect, it, vi } from 'vitest'

import {
  SchedulingSeeder,
  type SchedulingSeedReferences,
} from '@/scheduling/database/scheduling-seeder'

function createReferences(): SchedulingSeedReferences {
  const appointments = Array.from({ length: 13 }, (_, index) => ({
    intakeId: `intake-${index + 1}`,
    clientId: `client-${index + 1}`,
  }))
  const pendingMarkersAppointment = appointments.at(-1)

  if (!pendingMarkersAppointment) throw new Error('Expected a seeded appointment')

  return {
    appointments,
    pendingMarkersIntakeId: pendingMarkersAppointment.intakeId,
    assignedLawyerId: 'lawyer-1',
    lawyerIds: ['lawyer-1', 'lawyer-2'],
  }
}

function createSeeder() {
  const schedulesRepository = {
    addMany: vi.fn(async (schedules: readonly Schedule[]) => schedules),
    removeAll: vi.fn(async () => {}),
    createBlockedPeriod: vi.fn(async (input: Record<string, unknown>) => ({
      id: 'blocked-period-1',
      ...input,
    })),
  }
  const appointmentsRepository = {
    addMany: vi.fn(async (appointments: readonly Appointment[]) => appointments),
    removeAll: vi.fn(async () => {}),
  }

  return {
    seeder: new SchedulingSeeder(
      schedulesRepository as never,
      appointmentsRepository as never,
    ),
    schedulesRepository,
    appointmentsRepository,
  }
}

describe('SchedulingSeeder', () => {
  it.each([
    {
      now: new Date('2026-11-01T02:30:00.000Z'),
      month: '2026-10',
      firstDate: '2026-10-05',
    },
    {
      now: new Date('2026-11-15T12:00:00.000Z'),
      month: '2026-11',
      firstDate: '2026-11-02',
    },
  ])('seeds all appointments in the current São Paulo month: $month', async ({
    now,
    month,
    firstDate,
  }) => {
    const { seeder } = createSeeder()
    const result = await seeder.run(createReferences(), now)

    const appointmentDates = result.appointments.map(({ startsAt }) =>
      startsAt.toISOString().slice(0, 10),
    )

    expect(result.appointments).toHaveLength(13)
    expect(appointmentDates.every((date) => date.startsWith(month))).toBe(true)
    expect([...appointmentDates].sort()[0]).toBe(firstDate)
    expect(result.schedule.blockedPeriods[0]?.startsOn.slice(0, 7)).toBe(month)
  })
})
