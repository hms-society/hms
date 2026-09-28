import type { Appointment } from '../entities'
import {
  AppointmentConflictError,
  AppointmentRetryConflictError,
  ScheduleNotFoundError,
} from '../errors'
import type {
  AppointmentsRepository,
  SchedulingDatabase,
  SchedulesRepository,
} from '../../interfaces'
import type { DatetimeProvider, IdProvider, UseCase } from '#shared/interfaces'

type Request = {
  intakeId: string
  clientId: string
  assignedLawyerId: string
  startsAt: Date
}

type Response = Appointment

export class ReserveIntakeAppointmentUseCase implements UseCase<Request, Response> {
  private readonly database?: SchedulingDatabase
  private readonly schedulesRepository?: SchedulesRepository
  private readonly appointmentsRepository?: AppointmentsRepository
  private readonly idProvider: IdProvider
  private readonly datetimeProvider: DatetimeProvider

  constructor(
    database: SchedulingDatabase,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
  )
  constructor(
    schedulesRepository: SchedulesRepository,
    appointmentsRepository: AppointmentsRepository,
    idProvider: IdProvider,
    datetimeProvider: DatetimeProvider,
  )
  constructor(
    databaseOrSchedulesRepository: SchedulingDatabase | SchedulesRepository,
    idProviderOrAppointmentsRepository: IdProvider | AppointmentsRepository,
    datetimeProviderOrIdProvider: DatetimeProvider | IdProvider,
    legacyDatetimeProvider?: DatetimeProvider,
  ) {
    if ('run' in databaseOrSchedulesRepository) {
      this.database = databaseOrSchedulesRepository
      this.idProvider = idProviderOrAppointmentsRepository as IdProvider
      this.datetimeProvider = datetimeProviderOrIdProvider as DatetimeProvider
    } else {
      this.schedulesRepository = databaseOrSchedulesRepository
      this.appointmentsRepository =
        idProviderOrAppointmentsRepository as AppointmentsRepository
      this.idProvider = datetimeProviderOrIdProvider as IdProvider
      this.datetimeProvider = legacyDatetimeProvider as DatetimeProvider
    }
  }

  async execute(request: Request): Promise<Response> {
    if (this.database) {
      return this.database.run(
        async ({ schedulesRepository, appointmentsRepository }) => {
          const schedule = await schedulesRepository.findByCollaboratorIdForUpdate(
            request.assignedLawyerId,
          )
          if (!schedule) throw new ScheduleNotFoundError()
          return this.reserve(request, schedule, appointmentsRepository)
        },
      )
    }

    const schedule = await this.schedulesRepository?.findByCollaboratorId(
      request.assignedLawyerId,
    )
    if (!schedule) throw new ScheduleNotFoundError()
    return this.reserve(
      request,
      schedule,
      this.appointmentsRepository as AppointmentsRepository,
    )
  }

  private async reserve(
    request: Request,
    schedule: { id: string; appointmentDurationInMinutes: number },
    appointmentsRepository: AppointmentsRepository,
  ): Promise<Response> {
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
  }
}
