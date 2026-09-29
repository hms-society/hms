import { Inject, Injectable } from '@nestjs/common'
import {
  AppointmentFaker,
  ScheduleFaker,
} from '@hms/core/scheduling/domain/entities/fakers'
import type {
  AppointmentsRepository,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'

import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'

export type SchedulingSeedReferences = {
  readonly appointments: readonly {
    readonly intakeId: string
    readonly clientId: string
  }[]
  readonly assignedLawyerId: string
}

@Injectable()
export class SchedulingSeeder {
  constructor(
    @Inject(SCHEDULING_REPOSITORIES.schedules)
    private readonly schedulesRepository: SchedulesRepository,
    @Inject(SCHEDULING_REPOSITORIES.appointments)
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  async clear() {
    await this.appointmentsRepository.removeAll()
    await this.schedulesRepository.removeAll()
  }

  async run(references: SchedulingSeedReferences) {
    const schedule = ScheduleFaker.fake({
      collaboratorId: references.assignedLawyerId,
      weeklyAvailability: [
        {
          weekday: 'monday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
        {
          weekday: 'tuesday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
        {
          weekday: 'wednesday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
        {
          weekday: 'thursday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
        {
          weekday: 'friday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
      ],
    })
    const [createdSchedule] = await this.schedulesRepository.addMany([schedule])
    const blockedPeriod = await this.schedulesRepository.createBlockedPeriod({
      scheduleId: createdSchedule.id,
      startsOn: '2026-09-30',
      endsOn: '2026-09-30',
      reason: 'Audiência externa',
    })
    const appointmentStartTimes = [
      '2026-09-21T12:00:00.000Z',
      '2026-09-21T14:00:00.000Z',
      '2026-09-22T12:00:00.000Z',
      '2026-09-22T14:00:00.000Z',
      '2026-09-22T16:00:00.000Z',
      '2026-09-23T12:00:00.000Z',
      '2026-09-23T14:00:00.000Z',
      '2026-09-23T16:00:00.000Z',
      '2026-09-24T12:00:00.000Z',
      '2026-09-24T14:00:00.000Z',
      '2026-09-25T12:00:00.000Z',
      '2026-09-25T13:00:00.000Z',
      '2026-09-25T15:00:00.000Z',
    ]
    const appointments = references.appointments
      .slice(0, appointmentStartTimes.length)
      .map(({ intakeId, clientId }, index) => {
        const startsAt = new Date(appointmentStartTimes[index])

        return AppointmentFaker.fake({
          intakeId,
          scheduleId: createdSchedule.id,
          clientId,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 45 * 60 * 1000),
        })
      })
    const createdAppointments = await this.appointmentsRepository.addMany(appointments)

    const appointment = createdAppointments[0]

    return {
      schedule: { ...createdSchedule, blockedPeriods: [blockedPeriod] },
      appointment,
      appointments: createdAppointments,
    }
  }
}
