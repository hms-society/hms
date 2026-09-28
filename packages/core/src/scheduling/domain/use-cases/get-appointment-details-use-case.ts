import type { CollaboratorProfile as CollaboratorProfileValue } from '#identity/domain/structures'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
  UseCase,
} from '#shared/interfaces'

import type {
  CalendarAppointment,
  AppointmentChangeDisplay,
  AppointmentDetails,
} from '../structures'
import { AppointmentActionForbiddenError, AppointmentNotFoundError } from '../errors'
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
}

export class GetAppointmentDetailsUseCase
  implements UseCase<Request, AppointmentDetails>
{
  constructor(
    private readonly appointmentsRepository: CalendarAppointmentsRepository,
    private readonly schedulesRepository: CalendarSchedulesRepository,
    private readonly identityProvider: CalendarIdentityProvider,
    private readonly consultationProvider: CalendarConsultationProvider,
  ) {}

  async execute(request: Request): Promise<AppointmentDetails> {
    assertReadAccess(request.actor)
    const appointment = await this.appointmentsRepository.findById(request.appointmentId)
    if (!appointment) throw new AppointmentNotFoundError()
    const schedule = await this.schedulesRepository.findById(appointment.scheduleId)
    if (
      !schedule ||
      (request.actor.profile === 'lawyer' &&
        schedule.collaboratorId !== request.actor.collaboratorId)
    ) {
      throw new AppointmentNotFoundError()
    }

    const [client, lawyer, consultations, changes] = await Promise.all([
      this.identityProvider.getClients([appointment.clientId]),
      this.identityProvider.getLawyers([schedule.collaboratorId]),
      this.consultationProvider.getByAppointmentIds([appointment.id]),
      this.appointmentsRepository.listChanges(appointment.id),
    ])
    const clientSummary = client.get(appointment.clientId)
    const lawyerSummary = lawyer.get(schedule.collaboratorId)
    if (!clientSummary || !lawyerSummary) throw new AppointmentNotFoundError()

    const actorIds = [...new Set(changes.map((change) => change.actorId))]
    const actors = await this.identityProvider.getCollaborators(actorIds)
    const displayedChanges: AppointmentChangeDisplay[] = changes.map((change) => ({
      ...change,
      actorName: actors.get(change.actorId)?.name ?? 'Colaborador não encontrado',
    }))
    const consultation = consultations.get(appointment.id)
    const calendarAppointment: CalendarAppointment = {
      kind: 'appointment',
      appointmentId: appointment.id,
      scheduleId: appointment.scheduleId,
      clientId: appointment.clientId,
      clientName: clientSummary.name,
      lawyerId: schedule.collaboratorId,
      lawyerName: lawyerSummary.name,
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
            ...(canOpenConsultation(request.actor, schedule.collaboratorId)
              ? { consultationId: consultation.id }
              : {}),
          }
        : {}),
      updatedAt: appointment.updatedAt,
    }
    return { ...calendarAppointment, changes: displayedChanges }
  }
}

function assertReadAccess(actor: Request['actor']): void {
  if (actor.status && actor.status !== 'active')
    throw new AppointmentActionForbiddenError()
  if (
    !['admin', 'attendant', 'lawyer', 'paralegal', 'supervisor'].includes(actor.profile)
  ) {
    throw new AppointmentActionForbiddenError()
  }
}

function canOpenConsultation(actor: Request['actor'], lawyerId: string): boolean {
  return (
    actor.profile === 'admin' ||
    (actor.profile === 'lawyer' && actor.collaboratorId === lawyerId)
  )
}
