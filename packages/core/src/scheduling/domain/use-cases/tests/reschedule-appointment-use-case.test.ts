import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { AppointmentFaker, ScheduleFaker } from '../../entities/fakers'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
  IdProvider,
  RescheduledAppointmentConsultationProvider,
} from '#shared/interfaces'
import type { AppointmentsRepository, SchedulingDatabase, SchedulesRepository } from '../../../interfaces'
import {
  AppointmentActionForbiddenError,
  AppointmentConflictError,
  AppointmentNotEditableError,
  AppointmentNotFoundError,
  AppointmentRevisionConflictError,
} from '../../errors'
import { RescheduleAppointmentUseCase } from '../reschedule-appointment-use-case'

describe('Reschedule Appointment Use Case', () => {
  let appointmentsRepository: MockProxy<AppointmentsRepository>
  let schedulesRepository: MockProxy<SchedulesRepository>
  let database: MockProxy<SchedulingDatabase>
  let identityProvider: MockProxy<CalendarIdentityProvider>
  let consultationProvider: MockProxy<CalendarConsultationProvider>
  let rescheduledConsultationProvider: MockProxy<RescheduledAppointmentConsultationProvider>
  let idProvider: MockProxy<IdProvider>

  beforeEach(() => {
    appointmentsRepository = mock<AppointmentsRepository>()
    schedulesRepository = mock<SchedulesRepository>()
    database = mock<SchedulingDatabase>()
    identityProvider = mock<CalendarIdentityProvider>()
    consultationProvider = mock<CalendarConsultationProvider>()
    rescheduledConsultationProvider = mock<RescheduledAppointmentConsultationProvider>()
    idProvider = mock<IdProvider>()
    idProvider.generate.mockReturnValue('change-1')
    database.run.mockImplementation(async (operation) =>
      operation({ appointmentsRepository, schedulesRepository }),
    )
  })

  it('preserves the appointment identity while moving its interval', async () => {
    const schedule = ScheduleFaker.fake({
      collaboratorId: 'lawyer-1',
      weeklyAvailability: [{ weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }] }],
    })
    let appointment = AppointmentFaker.fake({
      scheduleId: schedule.id,
      startsAt: new Date('2026-08-10T12:00:00Z'),
      endsAt: new Date('2026-08-10T12:45:00Z'),
    })
    const revision = appointment.updatedAt
    const lockOrder: string[] = []
    appointmentsRepository.findByIdForUpdate.mockImplementation(async () => {
      lockOrder.push('appointment')
      return appointment
    })
    appointmentsRepository.findById.mockImplementation(async () => appointment)
    appointmentsRepository.replaceIfRevisionMatches.mockImplementation(async (_id, _revision, changes) => {
      appointment = { ...appointment, ...changes }
      return appointment
    })
    appointmentsRepository.listOverlapping.mockResolvedValue([])
    schedulesRepository.findByIdForUpdate.mockImplementation(async (scheduleId) => {
      lockOrder.push(`schedule:${scheduleId}`)
      return schedule
    })
    schedulesRepository.findById.mockResolvedValue(schedule)
    schedulesRepository.listBlockedPeriods.mockResolvedValue([])
    appointmentsRepository.listChanges.mockResolvedValue([])
    identityProvider.getClients.mockResolvedValue(new Map([[appointment.clientId, { name: 'Client' }]]))
    identityProvider.getLawyers.mockResolvedValue(new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]))
    identityProvider.getCollaborators.mockResolvedValue(new Map())
    consultationProvider.getByAppointmentIds.mockResolvedValue(new Map())

    const result = await new RescheduleAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      { now: () => new Date('2026-08-02T00:00:00Z') },
      idProvider,
      appointmentsRepository,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      appointmentId: appointment.id,
      expectedRevision: revision,
      startsAt: new Date('2026-08-10T13:00:00Z'),
    })

    expect(result.appointmentId).toBe(appointment.id)
    expect(appointmentsRepository.addChange).toHaveBeenCalledTimes(1)
    const change = appointmentsRepository.addChange.mock.calls[0][0]
    expect(change.resultingRevision.getTime()).toBeGreaterThan(revision.getTime())
    expect(lockOrder).toEqual([`schedule:${schedule.id}`, 'appointment'])
    expect(schedulesRepository.findByIdForUpdate).toHaveBeenCalledTimes(1)
  })

  it('locks source and destination schedules once in lexicographic order', async () => {
    const originSchedule = ScheduleFaker.fake({
      id: 'schedule-z',
      collaboratorId: 'lawyer-z',
      weeklyAvailability: [{ weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }] }],
    })
    const destinationSchedule = ScheduleFaker.fake({
      id: 'schedule-a',
      collaboratorId: 'lawyer-a',
      weeklyAvailability: [{ weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }] }],
    })
    let appointment = AppointmentFaker.fake({
      scheduleId: originSchedule.id,
      startsAt: new Date('2026-08-10T12:00:00Z'),
      endsAt: new Date('2026-08-10T12:45:00Z'),
    })
    const revision = appointment.updatedAt
    const lockOrder: string[] = []
    const schedulesById = new Map([
      [originSchedule.id, originSchedule],
      [destinationSchedule.id, destinationSchedule],
    ])
    appointmentsRepository.findById.mockImplementation(async () => appointment)
    appointmentsRepository.findByIdForUpdate.mockImplementation(async () => {
      lockOrder.push('appointment')
      return appointment
    })
    appointmentsRepository.replaceIfRevisionMatches.mockImplementation(async (_id, _revision, changes) => {
      appointment = { ...appointment, ...changes }
      return appointment
    })
    appointmentsRepository.listOverlapping.mockResolvedValue([])
    appointmentsRepository.listChanges.mockResolvedValue([])
    schedulesRepository.findById.mockImplementation(async (scheduleId) =>
      schedulesById.get(scheduleId) ?? null,
    )
    schedulesRepository.findByCollaboratorId.mockResolvedValue(destinationSchedule)
    schedulesRepository.findByIdForUpdate.mockImplementation(async (scheduleId) => {
      lockOrder.push(`schedule:${scheduleId}`)
      return schedulesById.get(scheduleId) ?? null
    })
    schedulesRepository.listBlockedPeriods.mockResolvedValue([])
    identityProvider.getClients.mockResolvedValue(new Map([[appointment.clientId, { name: 'Client' }]]))
    identityProvider.getLawyers.mockResolvedValue(new Map([[destinationSchedule.collaboratorId, { name: 'Lawyer', active: true }]]))
    identityProvider.getCollaborators.mockResolvedValue(new Map())
    consultationProvider.getByAppointmentIds.mockResolvedValue(new Map())

    await new RescheduleAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      { now: () => new Date('2026-08-02T00:00:00Z') },
      idProvider,
      appointmentsRepository,
      rescheduledConsultationProvider,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      appointmentId: appointment.id,
      expectedRevision: revision,
      startsAt: new Date('2026-08-10T13:00:00Z'),
      lawyerId: destinationSchedule.collaboratorId,
    })

    expect(lockOrder).toEqual(['schedule:schedule-a', 'schedule:schedule-z', 'appointment'])
    expect(schedulesRepository.findByIdForUpdate).toHaveBeenCalledTimes(2)
    expect(rescheduledConsultationProvider.syncLawyerForAppointment).toHaveBeenCalledWith(
      appointment.id,
      destinationSchedule.collaboratorId,
    )
  })

  it('forbids inactive actors and roles without write access', async () => {
    const useCase = new RescheduleAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      { now: () => new Date('2026-08-02T00:00:00Z') },
      idProvider,
      appointmentsRepository,
    )
    const request = {
      appointmentId: 'appointment-1',
      expectedRevision: new Date('2026-08-01T00:00:00Z'),
      startsAt: new Date('2026-08-10T13:00:00Z'),
    }

    await expect(
      useCase.execute({ ...request, actor: { collaboratorId: 'user-1', profile: 'admin', status: 'inactive' } }),
    ).rejects.toBeInstanceOf(AppointmentActionForbiddenError)
    await expect(
      useCase.execute({ ...request, actor: { collaboratorId: 'user-1', profile: 'supervisor' } }),
    ).rejects.toBeInstanceOf(AppointmentActionForbiddenError)
    expect(database.run).not.toHaveBeenCalled()
  })

  it('rejects missing appointments and inactive destination lawyers', async () => {
    const schedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
    const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    const useCase = new RescheduleAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      { now: () => new Date('2026-08-02T00:00:00Z') },
      idProvider,
      appointmentsRepository,
    )
    const request = {
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' as const },
      appointmentId: appointment.id,
      expectedRevision: appointment.updatedAt,
      startsAt: new Date('2026-08-10T13:00:00Z'),
    }

    appointmentsRepository.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(AppointmentNotFoundError)

    appointmentsRepository.findById.mockResolvedValue(appointment)
    schedulesRepository.findById.mockResolvedValue(schedule)
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: false }]]),
    )
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(AppointmentConflictError)
    expect(schedulesRepository.findByIdForUpdate).not.toHaveBeenCalled()
  })

  it('rejects stale appointment revisions and already-started consultations', async () => {
    const schedule = ScheduleFaker.fake({
      collaboratorId: 'lawyer-1',
      weeklyAvailability: [{ weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '12:00' }] }],
    })
    const appointment = AppointmentFaker.fake({
      scheduleId: schedule.id,
      startsAt: new Date('2026-08-10T12:00:00Z'),
      endsAt: new Date('2026-08-10T12:45:00Z'),
    })
    const useCase = new RescheduleAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      { now: () => new Date('2026-08-02T00:00:00Z') },
      idProvider,
      appointmentsRepository,
    )
    const request = {
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' as const },
      appointmentId: appointment.id,
      expectedRevision: new Date(appointment.updatedAt.getTime() - 1),
      startsAt: new Date('2026-08-10T13:00:00Z'),
    }
    appointmentsRepository.findById.mockResolvedValue(appointment)
    appointmentsRepository.findByIdForUpdate.mockResolvedValue(appointment)
    schedulesRepository.findById.mockResolvedValue(schedule)
    schedulesRepository.findByIdForUpdate.mockResolvedValue(schedule)
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
    )

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(AppointmentRevisionConflictError)

    const currentRequest = { ...request, expectedRevision: appointment.updatedAt }
    consultationProvider.getByAppointmentIds.mockResolvedValue(
      new Map([[
        appointment.id,
        { id: 'consultation-1', status: 'in_progress', startedAt: new Date('2026-08-10T12:30:00Z') },
      ]]),
    )
    await expect(useCase.execute(currentRequest)).rejects.toBeInstanceOf(AppointmentNotEditableError)
    expect(appointmentsRepository.replaceIfRevisionMatches).not.toHaveBeenCalled()
  })

  it('rejects a requested interval that is outside destination availability', async () => {
    const schedule = ScheduleFaker.fake({
      collaboratorId: 'lawyer-1',
      weeklyAvailability: [{ weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '10:00' }] }],
    })
    const appointment = AppointmentFaker.fake({
      scheduleId: schedule.id,
      startsAt: new Date('2026-08-10T12:00:00Z'),
      endsAt: new Date('2026-08-10T12:45:00Z'),
    })
    appointmentsRepository.findById.mockResolvedValue(appointment)
    appointmentsRepository.findByIdForUpdate.mockResolvedValue(appointment)
    schedulesRepository.findById.mockResolvedValue(schedule)
    schedulesRepository.findByIdForUpdate.mockResolvedValue(schedule)
    schedulesRepository.listBlockedPeriods.mockResolvedValue([])
    appointmentsRepository.listOverlapping.mockResolvedValue([])
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
    )
    consultationProvider.getByAppointmentIds.mockResolvedValue(new Map())

    const useCase = new RescheduleAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      { now: () => new Date('2026-08-02T00:00:00Z') },
      idProvider,
      appointmentsRepository,
    )
    await expect(
      useCase.execute({
        actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
        appointmentId: appointment.id,
        expectedRevision: appointment.updatedAt,
        startsAt: new Date('2026-08-10T13:00:00Z'),
      }),
    ).rejects.toBeInstanceOf(AppointmentConflictError)
    expect(appointmentsRepository.replaceIfRevisionMatches).not.toHaveBeenCalled()
  })
})
