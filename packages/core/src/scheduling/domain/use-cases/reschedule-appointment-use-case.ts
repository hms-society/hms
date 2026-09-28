import type { CollaboratorProfile as CollaboratorProfileValue } from '#identity/domain/structures'
import type { CalendarConsultationProvider, CalendarIdentityProvider, DatetimeProvider, IdProvider, RescheduledAppointmentConsultationProvider, UseCase } from '#shared/interfaces'

import type { Appointment, Schedule } from '../entities'
import { AppointmentActionForbiddenError, AppointmentConflictError, AppointmentNotEditableError, AppointmentNotFoundError, AppointmentRevisionConflictError } from '../errors'
import type { AppointmentDetails } from '../structures'
import type { AppointmentsRepository, SchedulingDatabase, SchedulesRepository } from '../../interfaces'
import { CheckAppointmentAvailabilityUseCase } from './check-appointment-availability-use-case'
import { GetAppointmentDetailsUseCase } from './get-appointment-details-use-case'

type Request = {
  actor: {
    collaboratorId: string
    profile: CollaboratorProfileValue
    status?: string
  }
  appointmentId: string
  expectedRevision: Date
  startsAt: Date
  lawyerId?: string
}

export class RescheduleAppointmentUseCase implements UseCase<Request, AppointmentDetails> {
  private readonly checkAvailability = new CheckAppointmentAvailabilityUseCase()
  private readonly getDetails: GetAppointmentDetailsUseCase

  constructor(
    private readonly database: SchedulingDatabase,
    schedulesRepository: SchedulesRepository,
    private readonly identityProvider: CalendarIdentityProvider,
    private readonly consultationProvider: CalendarConsultationProvider,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
    appointmentsRepository?: AppointmentsRepository,
    private readonly rescheduledConsultationProvider?: RescheduledAppointmentConsultationProvider,
  ) {
    this.getDetails = new GetAppointmentDetailsUseCase(
      appointmentsRepository ?? ({ } as AppointmentsRepository),
      schedulesRepository,
      identityProvider,
      consultationProvider,
    )
  }

  async execute(request: Request): Promise<AppointmentDetails> {
    assertWriteAccess(request.actor)
    await this.database.run(async ({ appointmentsRepository, schedulesRepository }) => {
      const appointmentReference = await appointmentsRepository.findById(request.appointmentId)
      if (!appointmentReference) throw new AppointmentNotFoundError()
      const originSchedule = await schedulesRepository.findById(appointmentReference.scheduleId)
      if (!originSchedule) throw new AppointmentNotFoundError()
      const targetLawyerId = request.lawyerId ?? originSchedule.collaboratorId
      const lawyer = (await this.identityProvider.getLawyers([targetLawyerId])).get(
        targetLawyerId,
      )
      if (!lawyer?.active) throw new AppointmentConflictError()
      const targetSchedule =
        targetLawyerId === originSchedule.collaboratorId
          ? originSchedule
          : await schedulesRepository.findByCollaboratorId(targetLawyerId)
      if (!targetSchedule) throw new AppointmentConflictError()

      const lockedSchedules = new Map<string, Schedule>()
      const scheduleIds = [...new Set([originSchedule.id, targetSchedule.id])].sort()
      for (const scheduleId of scheduleIds) {
        const schedule = await schedulesRepository.findByIdForUpdate(scheduleId)
        if (!schedule) throw new AppointmentConflictError()
        lockedSchedules.set(schedule.id, schedule)
      }
      const schedule = lockedSchedules.get(targetSchedule.id)
      if (!schedule) throw new AppointmentConflictError()
      const appointment = await appointmentsRepository.findByIdForUpdate(request.appointmentId)
      if (!appointment) throw new AppointmentNotFoundError()
      if (appointment.scheduleId !== originSchedule.id) {
        throw new AppointmentRevisionConflictError()
      }
      if (appointment.status !== 'scheduled') throw new AppointmentNotEditableError()
      if (appointment.updatedAt.getTime() !== request.expectedRevision.getTime()) {
        throw new AppointmentRevisionConflictError()
      }
      await this.assertEditable(appointment)
      const endsAt = new Date(
        request.startsAt.getTime() +
          (appointment.endsAt.getTime() - appointment.startsAt.getTime()),
      )
      const blockedPeriods = await schedulesRepository.listBlockedPeriods(
        [schedule.id],
        localDate(request.startsAt, schedule.timeZone),
        localDate(endsAt, schedule.timeZone),
      )
      const appointments = await appointmentsRepository.listOverlapping(
        new Date(request.startsAt.getTime() - 86_400_000),
        new Date(endsAt.getTime() + 86_400_000),
        [schedule.id],
      )
      if (
        request.startsAt <= this.datetimeProvider.now() ||
        !(await this.checkAvailability.execute({
          schedule,
          startsAt: request.startsAt,
          endsAt,
          blockedPeriods,
          appointments,
          excludeAppointmentId: appointment.id,
        }))
      ) {
        throw new AppointmentConflictError()
      }
      const now = this.datetimeProvider.now()
      const resultingRevision = new Date(
        Math.max(now.getTime(), appointment.updatedAt.getTime() + 1),
      )
      const rescheduled = await appointmentsRepository.replaceIfRevisionMatches(
        appointment.id,
        request.expectedRevision,
        {
          scheduleId: schedule.id,
          startsAt: request.startsAt,
          endsAt,
          updatedAt: resultingRevision,
        },
      )
      if (!rescheduled) throw new AppointmentRevisionConflictError()
      if (targetLawyerId !== originSchedule.collaboratorId) {
        if (!this.rescheduledConsultationProvider) throw new AppointmentNotEditableError()
        await this.rescheduledConsultationProvider.syncLawyerForAppointment(
          appointment.id,
          schedule.collaboratorId,
        )
      }
      await appointmentsRepository.addChange({
        id: this.idProvider.generate(),
        appointmentId: appointment.id,
        kind: 'rescheduled',
        actorId: request.actor.collaboratorId,
        occurredAt: resultingRevision,
        previousScheduleId: originSchedule.id,
        newScheduleId: schedule.id,
        previousStartsAt: appointment.startsAt,
        previousEndsAt: appointment.endsAt,
        newStartsAt: request.startsAt,
        newEndsAt: endsAt,
        previousRevision: appointment.updatedAt,
        resultingRevision,
      })
    })
    return this.getDetails.execute(request)
  }

  private async assertEditable(appointment: Appointment): Promise<void> {
    const consultation = await this.consultationProvider.getByAppointmentIds([appointment.id])
    const current = consultation.get(appointment.id)
    if (current && (current.status !== 'pending' || current.startedAt)) {
      throw new AppointmentNotEditableError()
    }
  }
}

function assertWriteAccess(actor: Request['actor']): void {
  if (actor.status && actor.status !== 'active') throw new AppointmentActionForbiddenError()
  if (actor.profile !== 'admin' && actor.profile !== 'attendant') {
    throw new AppointmentActionForbiddenError()
  }
}

function localDate(date: Date, timeZone: string): `${number}-${number}-${number}` {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date).map(({ type, value }) => [type, value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}` as `${number}-${number}-${number}`
}
