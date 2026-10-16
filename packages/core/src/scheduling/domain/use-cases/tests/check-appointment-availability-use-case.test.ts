import { describe, expect, it } from 'vitest'

import { AppointmentFaker, ScheduleFaker } from '../../entities/fakers'
import { CheckAppointmentAvailabilityUseCase } from '../check-appointment-availability-use-case'

describe('Check Appointment Availability Use Case', () => {
  const useCase = new CheckAppointmentAvailabilityUseCase()

  it('accepts an interval inside weekly availability', async () => {
    const schedule = ScheduleFaker.fake({
      weeklyAvailability: [
        { weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }] },
      ],
    })

    await expect(
      useCase.execute({
        schedule,
        startsAt: new Date('2026-08-10T12:00:00.000Z'),
        endsAt: new Date('2026-08-10T12:45:00.000Z'),
        blockedPeriods: [],
        appointments: [],
      }),
    ).resolves.toBe(true)
  })

  it('rejects overlap and permits an excluded appointment', async () => {
    const schedule = ScheduleFaker.fake({
      weeklyAvailability: [
        { weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }] },
      ],
    })
    const appointment = AppointmentFaker.fake({
      startsAt: new Date('2026-08-10T12:00:00.000Z'),
      endsAt: new Date('2026-08-10T12:45:00.000Z'),
    })
    const request = {
      schedule,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      blockedPeriods: [],
      appointments: [appointment],
    }

    await expect(useCase.execute(request)).resolves.toBe(false)
    await expect(
      useCase.execute({ ...request, excludeAppointmentId: appointment.id }),
    ).resolves.toBe(true)
  })

  it('rejects every slot on a one-day blocked period', async () => {
    const schedule = ScheduleFaker.fake({
      weeklyAvailability: [
        { weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }] },
      ],
    })

    await expect(
      useCase.execute({
        schedule,
        startsAt: new Date('2026-08-10T12:00:00.000Z'),
        endsAt: new Date('2026-08-10T12:45:00.000Z'),
        blockedPeriods: [
          {
            id: 'blocked-period-1',
            startsOn: '2026-08-10',
            endsOn: '2026-08-10',
            reason: 'Feriado',
            createdAt: new Date(),
          },
        ],
        appointments: [],
      }),
    ).resolves.toBe(false)
  })

  it('rejects a slot on the final day of a multi-day blocked period', async () => {
    const schedule = ScheduleFaker.fake({
      weeklyAvailability: [
        { weekday: 'wednesday', timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }] },
      ],
    })

    await expect(
      useCase.execute({
        schedule,
        startsAt: new Date('2026-08-12T12:00:00.000Z'),
        endsAt: new Date('2026-08-12T12:45:00.000Z'),
        blockedPeriods: [
          {
            id: 'blocked-period-1',
            startsOn: '2026-08-10',
            endsOn: '2026-08-12',
            reason: 'Férias',
            createdAt: new Date(),
          },
        ],
        appointments: [],
      }),
    ).resolves.toBe(false)
  })
})
