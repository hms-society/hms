import type { CollaboratorProfile as CollaboratorProfileValue } from '#identity/domain/structures'
import type {
  CalendarIdentityProvider,
  DatetimeProvider,
  UseCase,
} from '#shared/interfaces'

import type { AvailableSlot } from '../structures'
import {
  AppointmentActionForbiddenError,
  AppointmentConflictError,
  AppointmentNotEditableError,
  AppointmentNotFoundError,
} from '../errors'
import { CheckAppointmentAvailabilityUseCase } from './check-appointment-availability-use-case'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '../../interfaces'

type Request = {
  actor: {
    collaboratorId: string
    profile: CollaboratorProfileValue
    status?: string
  }
  appointmentId: string
  date: string
  lawyerId?: string
}

export class ListRescheduleSlotsUseCase
  implements UseCase<Request, readonly AvailableSlot[]>
{
  private readonly checkAvailability = new CheckAppointmentAvailabilityUseCase()

  constructor(
    private readonly appointmentsRepository: CalendarAppointmentsRepository,
    private readonly schedulesRepository: CalendarSchedulesRepository,
    private readonly datetimeProvider?: DatetimeProvider,
    private readonly identityProvider?: CalendarIdentityProvider,
  ) {}

  async execute(request: Request): Promise<readonly AvailableSlot[]> {
    assertWriteAccess(request.actor)
    const appointment = await this.appointmentsRepository.findById(request.appointmentId)
    if (!appointment) throw new AppointmentNotFoundError()
    if (appointment.status !== 'scheduled') throw new AppointmentNotEditableError()
    const currentSchedule = await this.schedulesRepository.findById(
      appointment.scheduleId,
    )
    if (!currentSchedule) throw new AppointmentNotFoundError()
    const lawyerId = request.lawyerId ?? currentSchedule.collaboratorId
    if (!this.identityProvider && request.lawyerId) throw new AppointmentConflictError()
    if (this.identityProvider) {
      const lawyer = (await this.identityProvider.getLawyers([lawyerId])).get(lawyerId)
      if (!lawyer?.active) throw new AppointmentConflictError()
    }
    const schedule =
      lawyerId === currentSchedule.collaboratorId
        ? currentSchedule
        : await this.schedulesRepository.findByCollaboratorId(lawyerId)
    if (!schedule) throw new AppointmentConflictError()
    const durationInMinutes =
      (appointment.endsAt.getTime() - appointment.startsAt.getTime()) / 60_000
    const date = parseDate(request.date)
    if (!date) throw new AppointmentConflictError()

    const dayStart = localDateToUtc(date, schedule.timeZone)
    const dayEnd = localDateToUtc(addDays(date, 1), schedule.timeZone)
    const [blockedPeriods, appointments] = await Promise.all([
      this.schedulesRepository.listBlockedPeriods(
        [schedule.id],
        date as `${number}-${number}-${number}`,
        date as `${number}-${number}-${number}`,
      ),
      this.appointmentsRepository.listOverlapping(dayStart, dayEnd, [schedule.id]),
    ])
    const weekday = weekdayForDate(date)
    const weekly = schedule.weeklyAvailability.find((item) => item.weekday === weekday)
    if (!weekly) return []
    const slots: AvailableSlot[] = []
    for (const range of weekly.timeRanges) {
      const rangeStart = timeToMinutes(range.startsAt)
      const rangeEnd = timeToMinutes(range.endsAt)
      for (
        let startsAtMinutes = rangeStart;
        startsAtMinutes + durationInMinutes <= rangeEnd;
        startsAtMinutes += 15
      ) {
        const startsAt = localDateTimeToUtc(date, startsAtMinutes, schedule.timeZone)
        const endsAt = new Date(startsAt.getTime() + durationInMinutes * 60_000)
        if (this.datetimeProvider && startsAt <= this.datetimeProvider.now()) continue
        if (
          await this.checkAvailability.execute({
            schedule,
            startsAt,
            endsAt,
            blockedPeriods,
            appointments,
            excludeAppointmentId: appointment.id,
          })
        ) {
          slots.push({ startsAt, endsAt, timeZone: schedule.timeZone })
        }
      }
    }
    return slots
  }
}

function assertWriteAccess(actor: Request['actor']): void {
  if (actor.status && actor.status !== 'active')
    throw new AppointmentActionForbiddenError()
  if (actor.profile !== 'admin' && actor.profile !== 'attendant') {
    throw new AppointmentActionForbiddenError()
  }
}

function parseDate(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00Z`)
  return date.toISOString().slice(0, 10) === value ? value : undefined
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function weekdayForDate(value: string) {
  return (
    [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const
  )[new Date(`${value}T00:00:00Z`).getUTCDay()]
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function localDateToUtc(date: string, timeZone: string): Date {
  return localDateTimeToUtc(date, 0, timeZone)
}

function localDateTimeToUtc(date: string, minutes: number, timeZone: string): Date {
  const target = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Math.floor(minutes / 60),
    minutes % 60,
  )
  let result = target
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(result)).map(({ type, value }) => [type, value]),
    )
    const localAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )
    result += target - localAsUtc
  }
  return new Date(result)
}
