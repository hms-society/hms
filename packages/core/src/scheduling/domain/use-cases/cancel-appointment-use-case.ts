import type { CollaboratorProfile as CollaboratorProfileValue } from '#identity/domain/structures'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
  DatetimeProvider,
  IdProvider,
  UseCase,
} from '#shared/interfaces'

import type { Appointment } from '../entities'
import {
  AppointmentActionForbiddenError,
  AppointmentNotEditableError,
  AppointmentNotFoundError,
  AppointmentRevisionConflictError,
} from '../errors'
import type { AppointmentDetails } from '../structures'
import type {
  AppointmentsRepository,
  SchedulingDatabase,
  SchedulesRepository,
} from '../../interfaces'
import { GetAppointmentDetailsUseCase } from './get-appointment-details-use-case'

type Request = {
  actor: {
    collaboratorId: string
    profile: CollaboratorProfileValue
    status?: string
  }
  appointmentId: string
  expectedRevision: Date
}

export class CancelAppointmentUseCase implements UseCase<Request, AppointmentDetails> {
  private readonly getDetails: GetAppointmentDetailsUseCase

  constructor(
    private readonly database: SchedulingDatabase,
    schedulesRepository: SchedulesRepository,
    identityProvider: CalendarIdentityProvider,
    private readonly consultationProvider: CalendarConsultationProvider,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
    appointmentsRepository?: AppointmentsRepository,
  ) {
    this.getDetails = new GetAppointmentDetailsUseCase(
      appointmentsRepository ?? ({} as AppointmentsRepository),
      schedulesRepository,
      identityProvider,
      consultationProvider,
    )
  }

  async execute(request: Request): Promise<AppointmentDetails> {
    assertWriteAccess(request.actor)
    await this.database.run(async ({ appointmentsRepository, schedulesRepository }) => {
      const appointmentReference = await appointmentsRepository.findById(
        request.appointmentId,
      )
      if (!appointmentReference) throw new AppointmentNotFoundError()
      const schedule = await schedulesRepository.findByIdForUpdate(
        appointmentReference.scheduleId,
      )
      if (!schedule) throw new AppointmentNotFoundError()
      const appointment = await appointmentsRepository.findByIdForUpdate(
        request.appointmentId,
      )
      if (!appointment) throw new AppointmentNotFoundError()
      if (appointment.status === 'cancelled') return
      if (appointment.updatedAt.getTime() !== request.expectedRevision.getTime()) {
        throw new AppointmentRevisionConflictError()
      }
      await this.assertEditable(appointment)
      const now = this.datetimeProvider.now()
      const resultingRevision = new Date(
        Math.max(now.getTime(), appointment.updatedAt.getTime() + 1),
      )
      const cancelled = await appointmentsRepository.replaceIfRevisionMatches(
        appointment.id,
        request.expectedRevision,
        {
          status: 'cancelled',
          cancelledAt: resultingRevision,
          updatedAt: resultingRevision,
        },
      )
      if (!cancelled) throw new AppointmentRevisionConflictError()
      await appointmentsRepository.addChange({
        id: this.idProvider.generate(),
        appointmentId: appointment.id,
        kind: 'cancelled',
        actorId: request.actor.collaboratorId,
        occurredAt: resultingRevision,
        previousStartsAt: appointment.startsAt,
        previousEndsAt: appointment.endsAt,
        previousRevision: appointment.updatedAt,
        resultingRevision,
      })
    })
    return this.getDetails.execute(request)
  }

  private async assertEditable(appointment: Appointment): Promise<void> {
    const consultation = await this.consultationProvider.getByAppointmentIds([
      appointment.id,
    ])
    const current = consultation.get(appointment.id)
    if (current && (current.status !== 'pending' || current.startedAt)) {
      throw new AppointmentNotEditableError()
    }
  }
}

function assertWriteAccess(actor: Request['actor']): void {
  if (actor.status && actor.status !== 'active')
    throw new AppointmentActionForbiddenError()
  if (actor.profile !== 'admin' && actor.profile !== 'attendant') {
    throw new AppointmentActionForbiddenError()
  }
}
