import { Inject, Injectable } from '@nestjs/common'
import {
  AppointmentFaker,
  ScheduleFaker,
} from '@hms/core/scheduling/domain/entities/fakers'
import type { WeeklyAvailability } from '@hms/core/scheduling/domain/structures'
import type {
  AppointmentsRepository,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'

export type SchedulingSeedReferences = {
  readonly appointments: readonly {
    readonly intakeId: string
    readonly clientId: string
  }[]
  readonly assignedLawyerId: string
  readonly lawyerIds: readonly string[]
}

const WEEKLY_AVAILABILITIES_BY_LAWYER: WeeklyAvailability[][] = [
  [
    { weekday: 'monday', timeRanges: [{ startsAt: '08:00', endsAt: '12:00' }] },
    { weekday: 'tuesday', timeRanges: [{ startsAt: '10:00', endsAt: '14:00' }] },
    { weekday: 'wednesday', timeRanges: [{ startsAt: '10:00', endsAt: '14:00' }] },
    { weekday: 'thursday', timeRanges: [{ startsAt: '10:00', endsAt: '14:00' }] },
    { weekday: 'friday', timeRanges: [{ startsAt: '11:00', endsAt: '15:00' }] },
  ],
  [
    { weekday: 'monday', timeRanges: [{ startsAt: '10:00', endsAt: '13:00' }] },
    { weekday: 'tuesday', timeRanges: [{ startsAt: '12:00', endsAt: '16:00' }] },
    { weekday: 'wednesday', timeRanges: [{ startsAt: '12:00', endsAt: '16:00' }] },
    { weekday: 'thursday', timeRanges: [{ startsAt: '08:00', endsAt: '12:00' }] },
    { weekday: 'friday', timeRanges: [{ startsAt: '08:00', endsAt: '11:00' }] },
  ],
  [
    { weekday: 'monday', timeRanges: [{ startsAt: '13:00', endsAt: '17:00' }] },
    { weekday: 'tuesday', timeRanges: [{ startsAt: '08:00', endsAt: '11:00' }] },
    { weekday: 'wednesday', timeRanges: [{ startsAt: '08:00', endsAt: '11:00' }] },
    { weekday: 'thursday', timeRanges: [{ startsAt: '08:00', endsAt: '11:00' }] },
    { weekday: 'friday', timeRanges: [{ startsAt: '09:00', endsAt: '13:00' }] },
  ],
]

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
    const lawyerIds = [
      references.assignedLawyerId,
      ...references.lawyerIds.filter(
        (lawyerId) => lawyerId !== references.assignedLawyerId,
      ),
    ]
    const schedules = lawyerIds.map((collaboratorId, index) =>
      ScheduleFaker.fake({
        collaboratorId,
        weeklyAvailability:
          WEEKLY_AVAILABILITIES_BY_LAWYER[index % WEEKLY_AVAILABILITIES_BY_LAWYER.length],
      }),
    )
    const createdSchedules = await this.schedulesRepository.addMany(schedules)
    const scheduleByLawyerId = new Map(
      createdSchedules.map((schedule) => [schedule.collaboratorId, schedule]),
    )
    const createdSchedule = scheduleByLawyerId.get(references.assignedLawyerId)

    if (!createdSchedule) {
      throw new AppError('The assigned lawyer schedule could not be seeded')
    }

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

        const lawyerId = lawyerIds[index % lawyerIds.length]
        const schedule = lawyerId ? scheduleByLawyerId.get(lawyerId) : undefined

        if (!schedule) {
          throw new AppError(`Schedule for lawyer ${lawyerId} could not be seeded`)
        }

        return AppointmentFaker.fake({
          intakeId,
          scheduleId: schedule.id,
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
