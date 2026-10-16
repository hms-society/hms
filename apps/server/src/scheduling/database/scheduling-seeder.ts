import { Inject, Injectable } from '@nestjs/common'
import {
  AppointmentFaker,
  ScheduleFaker,
} from '@hms/core/scheduling/domain/entities/fakers'
import type {
  CalendarDate,
  WeeklyAvailability,
} from '@hms/core/scheduling/domain/structures'
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
  readonly pendingMarkersIntakeId: string
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

const APPOINTMENT_DAY_OFFSETS = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4]
const APPOINTMENT_UTC_HOURS = [12, 14, 12, 14, 16, 12, 14, 16, 12, 14, 12, 13, 15]
const SCHEDULING_TIME_ZONE = 'America/Sao_Paulo'

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

  async run(references: SchedulingSeedReferences, now = new Date()) {
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
      throw new AppError('The assigned lawyer schedule could not be seeded', 'Seed Error')
    }

    const monday = firstMondayOfCurrentMonth(now)
    const blockDate = civilDate(monday, 2)
    const blockedPeriod = await this.schedulesRepository.createBlockedPeriod({
      scheduleId: createdSchedule.id,
      startsOn: blockDate,
      endsOn: blockDate,
      reason: 'Audiência externa',
    })
    const appointments = references.appointments
      .slice(0, APPOINTMENT_DAY_OFFSETS.length)
      .map(({ intakeId, clientId }, index) => {
        const startsAt = new Date(
          Date.UTC(
            monday.getUTCFullYear(),
            monday.getUTCMonth(),
            monday.getUTCDate() + APPOINTMENT_DAY_OFFSETS[index],
            APPOINTMENT_UTC_HOURS[index],
          ),
        )
        const lawyerId = lawyerIds[index % lawyerIds.length]
        const schedule = lawyerId ? scheduleByLawyerId.get(lawyerId) : undefined

        if (!schedule) {
          throw new AppError(
            `Schedule for lawyer ${lawyerId} could not be seeded`,
            'Seed Error',
          )
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
    const appointment = createdAppointments.find(
      ({ intakeId }) => intakeId === references.appointments[0]?.intakeId,
    )
    const pendingMarkersAppointment = createdAppointments.find(
      ({ intakeId }) => intakeId === references.pendingMarkersIntakeId,
    )

    if (!appointment) {
      throw new AppError(
        'The document-production Appointment could not be seeded',
        'Seed Error',
      )
    }
    if (!pendingMarkersAppointment) {
      throw new AppError(
        'The pending-markers Appointment could not be seeded',
        'Seed Error',
      )
    }

    return {
      schedule: { ...createdSchedule, blockedPeriods: [blockedPeriod] },
      appointment,
      pendingMarkersAppointment,
      appointments: createdAppointments,
    }
  }
}

function firstMondayOfCurrentMonth(now: Date): Date {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHEDULING_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now)
  const year = Number(dateParts.find(({ type }) => type === 'year')?.value)
  const month = Number(dateParts.find(({ type }) => type === 'month')?.value)
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const daysUntilMonday = (8 - firstDay.getUTCDay()) % 7
  firstDay.setUTCDate(firstDay.getUTCDate() + daysUntilMonday)
  return firstDay
}

function civilDate(date: Date, daysAfter: number): CalendarDate {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + daysAfter),
  )
    .toISOString()
    .slice(0, 10) as CalendarDate
}
