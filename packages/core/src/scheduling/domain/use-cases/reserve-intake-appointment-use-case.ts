import type { Appointment } from '../entities'
import {
  AppointmentConflictError,
  AppointmentRetryConflictError,
  ScheduleNotFoundError,
} from '../errors'
import type { SchedulingDatabase } from '../../interfaces'
import type { DatetimeProvider, IdProvider, UseCase } from '#shared/interfaces'

type Request = {
  intakeId: string
  clientId: string
  assignedLawyerId: string
  startsAt: Date
}

type Response = Appointment

export class ReserveIntakeAppointmentUseCase implements UseCase<Request, Response> {
  constructor(
    private readonly database: SchedulingDatabase,
    private readonly idProvider: IdProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    return this.database.run(
      async ({ schedulesRepository, appointmentsRepository }) => {
        const schedule = await schedulesRepository.findByCollaboratorIdForUpdate(
          request.assignedLawyerId,
        )

        if (!schedule) throw new ScheduleNotFoundError()

        const existingAppointment = await appointmentsRepository.findByIntakeId(
          request.intakeId,
        )

        if (existingAppointment) {
          const matchesExistingAppointment =
            existingAppointment.scheduleId === schedule.id &&
            existingAppointment.clientId === request.clientId &&
            existingAppointment.startsAt.getTime() === request.startsAt.getTime()

          if (!matchesExistingAppointment) throw new AppointmentRetryConflictError()

          return existingAppointment
        }

        const endsAt = new Date(
          request.startsAt.getTime() + schedule.appointmentDurationInMinutes * 60_000,
        )
        const conflictingAppointment = await appointmentsRepository.findOverlapping(
          schedule.id,
          request.startsAt,
          endsAt,
        )

        if (conflictingAppointment) throw new AppointmentConflictError()

        const now = this.datetimeProvider.now()

        return appointmentsRepository.add({
          id: this.idProvider.generate(),
          intakeId: request.intakeId,
          scheduleId: schedule.id,
          clientId: request.clientId,
          startsAt: request.startsAt,
          endsAt,
          status: 'scheduled',
          createdAt: now,
          updatedAt: now,
        })
      },
    )
  }
}
