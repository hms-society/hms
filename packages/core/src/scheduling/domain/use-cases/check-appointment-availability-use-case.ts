import type { Appointment, BlockedPeriod, Schedule } from '../entities'
import type { UseCase } from '#shared/interfaces'

type Request = {
  schedule: Schedule
  startsAt: Date
  endsAt: Date
  blockedPeriods: readonly BlockedPeriod[]
  appointments: readonly Appointment[]
  excludeAppointmentId?: string
}

const WEEKDAY_BY_INDEX = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export class CheckAppointmentAvailabilityUseCase implements UseCase<Request, boolean> {
  async execute(request: Request): Promise<boolean> {
    if (request.endsAt.getTime() <= request.startsAt.getTime()) return false

    const start = getLocalParts(request.startsAt, request.schedule.timeZone)
    const end = getLocalParts(
      new Date(request.endsAt.getTime() - 1),
      request.schedule.timeZone,
    )
    if (start.date !== end.date) return false

    const weekday = WEEKDAY_BY_INDEX[start.weekday]
    const availability = request.schedule.weeklyAvailability.find(
      (item) => item.weekday === weekday,
    )
    const startsInMinutes = start.hour * 60 + start.minute
    const endsInMinutes = end.hour * 60 + end.minute + 1
    const fitsAvailability = availability?.timeRanges.some((range) => {
      const rangeStart = parseTime(range.startsAt)
      const rangeEnd = parseTime(range.endsAt)
      return startsInMinutes >= rangeStart && endsInMinutes <= rangeEnd
    })
    if (!fitsAvailability) return false

    const blocked = request.blockedPeriods.some(
      (period) => period.startsOn <= start.date && period.endsOn >= start.date,
    )
    if (blocked) return false

    return !request.appointments.some(
      (appointment) =>
        appointment.status === 'scheduled' &&
        appointment.id !== request.excludeAppointmentId &&
        appointment.startsAt < request.endsAt &&
        appointment.endsAt > request.startsAt,
    )
  }
}

function parseTime(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function getLocalParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const values = Object.fromEntries(
    formatter.formatToParts(date).map(({ type, value }) => [type, value]),
  )
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    values.weekday,
  )
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday,
    hour: Number(values.hour),
    minute: Number(values.minute),
  }
}
