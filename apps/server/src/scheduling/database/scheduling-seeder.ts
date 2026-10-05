import { Inject, Injectable } from '@nestjs/common'
import {
  AppointmentFaker,
  ScheduleFaker,
} from '@hms/core/scheduling/domain/entities/fakers'
import type {
  AppointmentsRepository,
  SchedulesRepository,
} from '@hms/core/scheduling/interfaces'

import { AppError } from '@hms/core/shared/domain/errors'

import { SCHEDULING_REPOSITORIES } from '@/scheduling/constants/scheduling-repositories'

export type SchedulingSeedReferences = {
  readonly pendingMarkersIntakeId?: string
  readonly intakeId: string
  readonly clientId: string
  readonly assignedLawyerId: string
}

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
    const schedule = ScheduleFaker.fake({
      collaboratorId: references.assignedLawyerId,
      weeklyAvailability: [
        {
          weekday: 'monday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
        {
          weekday: 'tuesday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
        {
          weekday: 'wednesday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
        {
          weekday: 'thursday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
        {
          weekday: 'friday',
          timeRanges: [{ startsAt: '08:00', endsAt: '18:00' }],
        },
      ],
    })
    const [createdSchedule] = await this.schedulesRepository.addMany([schedule])
    const appointment = AppointmentFaker.fake({
      intakeId: references.intakeId,
      scheduleId: createdSchedule.id,
      clientId: references.clientId,
      startsAt: new Date('2030-01-14T13:00:00.000Z'),
      endsAt: new Date('2030-01-14T13:45:00.000Z'),
    })
    const pendingMarkersAppointment = references.pendingMarkersIntakeId
      ? AppointmentFaker.fake({
          scheduleId: createdSchedule.id,
          clientId: references.clientId,
          intakeId: references.pendingMarkersIntakeId,
          startsAt: new Date('2030-01-14T14:00:00.000Z'),
          endsAt: new Date('2030-01-14T14:45:00.000Z'),
        })
      : undefined
    const appointments = await this.appointmentsRepository.addMany([
      appointment,
      ...(pendingMarkersAppointment ? [pendingMarkersAppointment] : []),
    ])

    const createdAppointment = appointments.find(
      ({ intakeId }) => intakeId === references.intakeId,
    )
    if (!createdAppointment) {
      throw new AppError(
        'The document-production Appointment could not be seeded.',
        'Seed Error',
      )
    }

    return {
      schedule: createdSchedule,
      appointment: createdAppointment,
      pendingMarkersAppointment: appointments.find(
        ({ intakeId }) => intakeId === references.pendingMarkersIntakeId,
      ),
    }
  }
}
