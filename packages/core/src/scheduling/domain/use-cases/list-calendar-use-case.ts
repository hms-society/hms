import type { CollaboratorProfile as CollaboratorProfileValue } from '#identity/domain/structures'
import type { UseCase } from '#shared/interfaces'

import type { Appointment, BlockedPeriod, Schedule } from '../entities'
import { AppointmentActionForbiddenError, AppointmentNotFoundError } from '../errors'
import type {
  CalendarAppointment,
  CalendarBlock,
  CalendarEvent,
  CalendarQuery,
} from '../structures'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
} from '#shared/interfaces'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '../../interfaces'

type Actor = {
  collaboratorId: string
  profile: CollaboratorProfileValue
  status?: string
}

type Request = {
  actor: Actor
  query: CalendarQuery
}

export class ListCalendarUseCase implements UseCase<Request, readonly CalendarEvent[]> {
  constructor(
    private readonly schedulesRepository: CalendarSchedulesRepository,
    private readonly appointmentsRepository: CalendarAppointmentsRepository,
    private readonly identityProvider: CalendarIdentityProvider,
    private readonly consultationProvider: CalendarConsultationProvider,
  ) {}

  async execute({ actor, query }: Request): Promise<readonly CalendarEvent[]> {
    assertReadAccess(actor)
    const period = getPeriod(query.view, query.date)
    const collaboratorIds = getScheduleCollaboratorIds(actor, query.lawyerId)
    if (collaboratorIds?.length === 0) return []
    const schedules =
      await this.schedulesRepository.listByCollaboratorIds(collaboratorIds)
    const scheduleIds = schedules.map((schedule) => schedule.id)
    if (scheduleIds.length === 0) return []

    const appointments = await this.appointmentsRepository.listOverlapping(
      period.from,
      period.to,
      scheduleIds,
      query.clientId,
    )
    const blocks =
      actor.profile === 'admin'
        ? []
        : await this.schedulesRepository.listBlockedPeriods(
            scheduleIds,
            period.startsOn as `${number}-${number}-${number}`,
            period.endsOn as `${number}-${number}-${number}`,
          )
    const appointmentsBySchedule = new Map(
      schedules.map((schedule) => [schedule.id, schedule]),
    )
    const filteredAppointments = appointments.filter((appointment) =>
      isInLocalPeriod(
        appointment,
        appointmentsBySchedule.get(appointment.scheduleId),
        period,
      ),
    )
    const consultations = await this.consultationProvider.getByAppointmentIds(
      filteredAppointments.map((appointment) => appointment.id),
    )
    const clientIds = unique(
      filteredAppointments.map((appointment) => appointment.clientId),
    )
    const lawyerIds = unique(schedules.map((schedule) => schedule.collaboratorId))
    const [clients, lawyers] = await Promise.all([
      this.identityProvider.getClients(clientIds),
      this.identityProvider.getLawyers(lawyerIds),
    ])

    const events: CalendarEvent[] = filteredAppointments.flatMap((appointment) => {
      const schedule = appointmentsBySchedule.get(appointment.scheduleId)
      const lawyer = schedule ? lawyers.get(schedule.collaboratorId) : undefined
      const client = clients.get(appointment.clientId)
      if (!schedule || !lawyer || !client) return []
      const consultation = consultations.get(appointment.id)
      const event: CalendarAppointment = {
        kind: 'appointment',
        appointmentId: appointment.id,
        scheduleId: appointment.scheduleId,
        clientId: appointment.clientId,
        clientName: client.name,
        lawyerId: schedule.collaboratorId,
        lawyerName: lawyer.name,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        timeZone: schedule.timeZone,
        status: appointment.status,
        ...(appointment.cancelledAt ? { cancelledAt: appointment.cancelledAt } : {}),
        ...(consultation
          ? {
              consultationStatus: consultation.status,
              ...(consultation.startedAt
                ? { consultationStartedAt: consultation.startedAt }
                : {}),
              ...(canOpenConsultation(actor, schedule.collaboratorId)
                ? { consultationId: consultation.id }
                : {}),
            }
          : {}),
        updatedAt: appointment.updatedAt,
      }
      return matchesEventFilter(event, query.event) ? [event] : []
    })

    if (!query.clientId && query.event !== 'no_show') {
      for (const block of blocks) {
        const schedule = appointmentsBySchedule.get(block.scheduleId)
        const lawyer = schedule ? lawyers.get(schedule.collaboratorId) : undefined
        if (!schedule || !lawyer || !isBlockInPeriod(block, period)) continue
        const event: CalendarBlock = {
          kind: 'block',
          blockedPeriodId: block.id,
          scheduleId: block.scheduleId,
          lawyerId: schedule.collaboratorId,
          lawyerName: lawyer.name,
          startsOn: block.startsOn,
          endsOn: block.endsOn,
          ...(block.reason ? { reason: block.reason } : {}),
          timeZone: schedule.timeZone,
        }
        if (matchesEventFilter(event, query.event)) events.push(event)
      }
    }

    return events.sort((left, right) => eventSortValue(left) - eventSortValue(right))
  }
}

function getScheduleCollaboratorIds(
  actor: Actor,
  lawyerId: string | undefined,
): readonly string[] | undefined {
  if (actor.profile === 'lawyer') {
    if (lawyerId && lawyerId !== actor.collaboratorId) return []
    return [actor.collaboratorId]
  }
  return lawyerId ? [lawyerId] : undefined
}

function assertReadAccess(actor: Actor): void {
  if (actor.status && actor.status !== 'active')
    throw new AppointmentActionForbiddenError()
  if (
    !['admin', 'attendant', 'lawyer', 'paralegal', 'supervisor'].includes(actor.profile)
  ) {
    throw new AppointmentActionForbiddenError()
  }
}

function canOpenConsultation(actor: Actor, lawyerId: string): boolean {
  return (
    actor.profile === 'admin' ||
    (actor.profile === 'lawyer' && actor.collaboratorId === lawyerId)
  )
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function getPeriod(view: CalendarQuery['view'], date: string) {
  const anchor = parseDate(date)
  if (!anchor) throw new AppointmentNotFoundError()
  let startsOn = new Date(anchor)
  let endsOn = new Date(anchor)
  if (view === 'week') {
    startsOn.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay())
    endsOn = new Date(startsOn)
    endsOn.setUTCDate(startsOn.getUTCDate() + 6)
  } else {
    startsOn = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
    endsOn = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0))
  }
  const followingDay = new Date(endsOn)
  followingDay.setUTCDate(endsOn.getUTCDate() + 1)
  return {
    startsOn: formatDate(startsOn),
    endsOn: formatDate(endsOn),
    from: new Date(startsOn.getTime() - 86_400_000),
    to: new Date(followingDay.getTime() + 86_400_000),
  }
}

function parseDate(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00.000Z`)
  return formatDate(date) === value ? date : undefined
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function isInLocalPeriod(
  appointment: Appointment,
  schedule: Schedule | undefined,
  period: ReturnType<typeof getPeriod>,
): boolean {
  if (!schedule) return false
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: schedule.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(appointment.startsAt)
  return localDate >= period.startsOn && localDate <= period.endsOn
}

function isBlockInPeriod(
  block: BlockedPeriod & { scheduleId: string },
  period: ReturnType<typeof getPeriod>,
): boolean {
  return block.endsOn >= period.startsOn && block.startsOn <= period.endsOn
}

function matchesEventFilter(
  event: CalendarEvent,
  filter: CalendarQuery['event'],
): boolean {
  if (filter === 'all') return true
  if (filter === 'blocked') return event.kind === 'block'
  if (event.kind === 'block') return false
  if (filter === 'no_show') return event.consultationStatus === 'no_show'
  return event.status === filter
}

function eventSortValue(event: CalendarEvent): number {
  return event.kind === 'block'
    ? Date.parse(`${event.startsOn}T00:00:00Z`)
    : event.startsAt.getTime()
}
