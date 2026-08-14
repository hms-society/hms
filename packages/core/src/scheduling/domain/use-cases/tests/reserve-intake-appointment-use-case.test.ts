import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { AppointmentFaker, ScheduleFaker } from '../../entities/fakers'
import {
  AppointmentConflictError,
  AppointmentRetryConflictError,
  ScheduleNotFoundError,
} from '../../errors'
import type { AppointmentsRepository, SchedulesRepository } from '../../../interfaces'
import type { DatetimeProvider, IdProvider } from '#shared/interfaces'
import { ReserveIntakeAppointmentUseCase } from '../reserve-intake-appointment-use-case'

const currentDate = new Date('2026-08-12T15:00:00.000Z')
const appointmentId = 'f7aab3e3-5474-4fdb-8d45-8508e44b7029'

describe('Reserve Intake Appointment Use Case', () => {
  let schedulesRepository: MockProxy<SchedulesRepository>
  let appointmentsRepository: MockProxy<AppointmentsRepository>
  let idProvider: MockProxy<IdProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    schedulesRepository = mock<SchedulesRepository>()
    appointmentsRepository = mock<AppointmentsRepository>()
    idProvider = mock<IdProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    idProvider.generate.mockReturnValue(appointmentId)
    datetimeProvider.now.mockReturnValue(currentDate)
  })

  it('reserves an Appointment in the selected lawyer schedule', async () => {
    const schedule = ScheduleFaker.fake({ appointmentDurationInMinutes: 45 })
    const appointment = AppointmentFaker.fake({
      id: appointmentId,
      scheduleId: schedule.id,
      clientId: '20cb02a4-4974-4fc0-bf65-0f5881afd532',
      intakeId: 'f20f3bb4-c2e5-4024-aca6-521f5f06f38a',
    })
    schedulesRepository.findByCollaboratorId.mockResolvedValue(schedule)
    appointmentsRepository.add.mockResolvedValue(appointment)
    const useCase = new ReserveIntakeAppointmentUseCase(
      schedulesRepository,
      appointmentsRepository,
      idProvider,
      datetimeProvider,
    )

    const result = await useCase.execute({
      intakeId: appointment.intakeId,
      clientId: appointment.clientId,
      assignedLawyerId: schedule.collaboratorId,
      startsAt: appointment.startsAt,
    })

    expect(result).toBe(appointment)
    expect(schedulesRepository.findByCollaboratorId).toHaveBeenCalledWith(
      schedule.collaboratorId,
    )
    expect(appointmentsRepository.add).toHaveBeenCalledWith({
      id: appointmentId,
      intakeId: appointment.intakeId,
      scheduleId: schedule.id,
      clientId: appointment.clientId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: 'scheduled',
      createdAt: currentDate,
      updatedAt: currentDate,
    })
  })

  it('returns the existing Appointment when the event is retried', async () => {
    const schedule = ScheduleFaker.fake()
    const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    schedulesRepository.findByCollaboratorId.mockResolvedValue(schedule)
    appointmentsRepository.findByIntakeId.mockResolvedValue(appointment)
    const useCase = new ReserveIntakeAppointmentUseCase(
      schedulesRepository,
      appointmentsRepository,
      idProvider,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        intakeId: appointment.intakeId,
        clientId: appointment.clientId,
        assignedLawyerId: schedule.collaboratorId,
        startsAt: appointment.startsAt,
      }),
    ).resolves.toBe(appointment)
    expect(schedulesRepository.findByCollaboratorId).toHaveBeenCalledWith(
      schedule.collaboratorId,
    )
    expect(appointmentsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects retry data that contradict an existing Appointment', async () => {
    const schedule = ScheduleFaker.fake()
    const appointment = AppointmentFaker.fake()
    schedulesRepository.findByCollaboratorId.mockResolvedValue(schedule)
    appointmentsRepository.findByIntakeId.mockResolvedValue(appointment)
    const useCase = new ReserveIntakeAppointmentUseCase(
      schedulesRepository,
      appointmentsRepository,
      idProvider,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        intakeId: appointment.intakeId,
        clientId: appointment.clientId,
        assignedLawyerId: schedule.collaboratorId,
        startsAt: appointment.startsAt,
      }),
    ).rejects.toBeInstanceOf(AppointmentRetryConflictError)
  })

  it('rejects a reservation without a selected lawyer schedule', async () => {
    const appointment = AppointmentFaker.fake()
    const useCase = new ReserveIntakeAppointmentUseCase(
      schedulesRepository,
      appointmentsRepository,
      idProvider,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        intakeId: appointment.intakeId,
        clientId: appointment.clientId,
        assignedLawyerId: 'b4a55c12-1fca-4e17-810f-28128f046553',
        startsAt: appointment.startsAt,
      }),
    ).rejects.toBeInstanceOf(ScheduleNotFoundError)
  })

  it('rejects an overlapping Appointment', async () => {
    const schedule = ScheduleFaker.fake()
    const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    schedulesRepository.findByCollaboratorId.mockResolvedValue(schedule)
    appointmentsRepository.findOverlapping.mockResolvedValue(appointment)
    const useCase = new ReserveIntakeAppointmentUseCase(
      schedulesRepository,
      appointmentsRepository,
      idProvider,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        intakeId: appointment.intakeId,
        clientId: appointment.clientId,
        assignedLawyerId: schedule.collaboratorId,
        startsAt: appointment.startsAt,
      }),
    ).rejects.toBeInstanceOf(AppointmentConflictError)
  })
})
