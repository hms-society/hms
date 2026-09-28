import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { AppointmentFaker, ScheduleFaker } from '../../entities/fakers'
import type { CalendarConsultationProvider, CalendarIdentityProvider } from '#shared/interfaces'
import type { AppointmentsRepository, SchedulesRepository } from '../../../interfaces'
import { AppointmentActionForbiddenError, AppointmentNotFoundError } from '../../errors'
import { ListCalendarUseCase } from '../list-calendar-use-case'

describe('List Calendar Use Case', () => {
  let appointmentsRepository: MockProxy<AppointmentsRepository>
  let schedulesRepository: MockProxy<SchedulesRepository>
  let identityProvider: MockProxy<CalendarIdentityProvider>
  let consultationProvider: MockProxy<CalendarConsultationProvider>

  beforeEach(() => {
    appointmentsRepository = mock<AppointmentsRepository>()
    schedulesRepository = mock<SchedulesRepository>()
    identityProvider = mock<CalendarIdentityProvider>()
    consultationProvider = mock<CalendarConsultationProvider>()
  })

  it('lists local appointments and hides blocks when a client filter is active', async () => {
    const schedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
    const appointment = AppointmentFaker.fake({
      scheduleId: schedule.id,
      startsAt: new Date('2026-08-10T12:00:00.000Z'),
      endsAt: new Date('2026-08-10T12:45:00.000Z'),
    })
    schedulesRepository.listByCollaboratorIds.mockResolvedValue([schedule])
    schedulesRepository.listBlockedPeriods.mockResolvedValue([
      { id: 'block-1', scheduleId: schedule.id, startsOn: '2026-08-10', endsOn: '2026-08-10', createdAt: new Date() },
    ])
    appointmentsRepository.listOverlapping.mockResolvedValue([appointment])
    identityProvider.getClients.mockResolvedValue(new Map([[appointment.clientId, { name: 'Client' }]]))
    identityProvider.getLawyers.mockResolvedValue(new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]))
    consultationProvider.getByAppointmentIds.mockResolvedValue(new Map())

    const events = await new ListCalendarUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
      consultationProvider,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      query: { view: 'week', date: '2026-08-10', event: 'all', clientId: appointment.clientId },
    })

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ kind: 'appointment', clientName: 'Client' })
  })

  it('applies the lawyer filter before loading schedules in a multi-lawyer calendar', async () => {
    const firstSchedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
    const secondSchedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-2' })
    const appointment = AppointmentFaker.fake({ scheduleId: secondSchedule.id })
    schedulesRepository.listByCollaboratorIds.mockResolvedValue([secondSchedule])
    schedulesRepository.listBlockedPeriods.mockResolvedValue([])
    appointmentsRepository.listOverlapping.mockResolvedValue([appointment])
    identityProvider.getClients.mockResolvedValue(new Map([[appointment.clientId, { name: 'Client' }]]))
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[secondSchedule.collaboratorId, { name: 'Second Lawyer', active: true }]]),
    )
    consultationProvider.getByAppointmentIds.mockResolvedValue(new Map())

    const events = await new ListCalendarUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
      consultationProvider,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      query: {
        view: 'week',
        date: '2026-08-10',
        event: 'all',
        lawyerId: secondSchedule.collaboratorId,
      },
    })

    expect(schedulesRepository.listByCollaboratorIds).toHaveBeenCalledWith([
      secondSchedule.collaboratorId,
    ])
    expect(events).toMatchObject([
      { kind: 'appointment', lawyerId: secondSchedule.collaboratorId },
    ])
    expect(events).not.toContainEqual(expect.objectContaining({ lawyerId: firstSchedule.collaboratorId }))
  })

  it.each(['attendant', 'supervisor', 'paralegal'] as const)(
    'exposes consultation status and start indicators to %s without the consultation ID',
    async (profile) => {
      const schedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
      const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
      const startedAt = new Date('2026-08-13T13:05:00.000Z')
      schedulesRepository.listByCollaboratorIds.mockResolvedValue([schedule])
      schedulesRepository.listBlockedPeriods.mockResolvedValue([])
      appointmentsRepository.listOverlapping.mockResolvedValue([appointment])
      identityProvider.getClients.mockResolvedValue(new Map([[appointment.clientId, { name: 'Client' }]]))
      identityProvider.getLawyers.mockResolvedValue(
        new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
      )
      consultationProvider.getByAppointmentIds.mockResolvedValue(
        new Map([[appointment.id, { id: 'consultation-1', status: 'no_show', startedAt }]]),
      )

      const events = await new ListCalendarUseCase(
        schedulesRepository,
        appointmentsRepository,
        identityProvider,
        consultationProvider,
      ).execute({
        actor: { collaboratorId: `${profile}-1`, profile },
        query: { view: 'week', date: '2026-08-10', event: 'all' },
      })

      expect(events[0]).toMatchObject({
        consultationStatus: 'no_show',
        consultationStartedAt: startedAt,
      })
      expect(events[0]).not.toHaveProperty('consultationId')
    },
  )

  it('rejects inactive actors and malformed civil dates before reading calendars', async () => {
    const useCase = new ListCalendarUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
      consultationProvider,
    )

    await expect(
      useCase.execute({
        actor: { collaboratorId: 'admin-1', profile: 'admin', status: 'inactive' },
        query: { view: 'week', date: '2026-08-10', event: 'all' },
      }),
    ).rejects.toBeInstanceOf(AppointmentActionForbiddenError)
    await expect(
      useCase.execute({
        actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
        query: { view: 'week', date: '2026-02-30', event: 'all' },
      }),
    ).rejects.toBeInstanceOf(AppointmentNotFoundError)
    expect(schedulesRepository.listByCollaboratorIds).not.toHaveBeenCalled()
  })

  it('includes appointments by the schedule local date across a UTC week boundary', async () => {
    const schedule = ScheduleFaker.fake({
      collaboratorId: 'lawyer-1',
      timeZone: 'Pacific/Kiritimati',
    })
    const localSundayAppointment = AppointmentFaker.fake({
      id: 'appointment-local-sunday',
      scheduleId: schedule.id,
      clientId: 'client-local',
      startsAt: new Date('2026-08-08T12:30:00Z'),
      endsAt: new Date('2026-08-08T13:15:00Z'),
    })
    const previousLocalDayAppointment = AppointmentFaker.fake({
      id: 'appointment-previous-local-day',
      scheduleId: schedule.id,
      clientId: 'client-previous',
      startsAt: new Date('2026-08-07T12:30:00Z'),
      endsAt: new Date('2026-08-07T13:15:00Z'),
    })
    schedulesRepository.listByCollaboratorIds.mockResolvedValue([schedule])
    schedulesRepository.listBlockedPeriods.mockResolvedValue([])
    appointmentsRepository.listOverlapping.mockResolvedValue([
      previousLocalDayAppointment,
      localSundayAppointment,
    ])
    identityProvider.getClients.mockResolvedValue(
      new Map([
        [localSundayAppointment.clientId, { name: 'Sunday Client' }],
        [previousLocalDayAppointment.clientId, { name: 'Previous Client' }],
      ]),
    )
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
    )
    consultationProvider.getByAppointmentIds.mockResolvedValue(new Map())

    const events = await new ListCalendarUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
      consultationProvider,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      query: { view: 'week', date: '2026-08-10', event: 'all' },
    })

    expect(events).toMatchObject([
      {
        kind: 'appointment',
        appointmentId: localSundayAppointment.id,
        timeZone: 'Pacific/Kiritimati',
      },
    ])
    expect(consultationProvider.getByAppointmentIds).toHaveBeenCalledWith([
      localSundayAppointment.id,
    ])
  })

  it('returns only no-show appointments or requested blocked periods for event filters', async () => {
    const schedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
    const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    const block = {
      id: 'block-1',
      scheduleId: schedule.id,
      startsOn: '2026-08-10',
      endsOn: '2026-08-10',
      createdAt: new Date('2026-08-01T00:00:00Z'),
    } as const
    schedulesRepository.listByCollaboratorIds.mockResolvedValue([schedule])
    schedulesRepository.listBlockedPeriods.mockResolvedValue([block])
    appointmentsRepository.listOverlapping.mockResolvedValue([appointment])
    identityProvider.getClients.mockResolvedValue(new Map([[appointment.clientId, { name: 'Client' }]]))
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
    )
    consultationProvider.getByAppointmentIds.mockResolvedValue(
      new Map([[appointment.id, { id: 'consultation-1', status: 'no_show' }]]),
    )
    const useCase = new ListCalendarUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
      consultationProvider,
    )
    const actor = { collaboratorId: 'attendant-1', profile: 'attendant' as const }

    const noShows = await useCase.execute({
      actor,
      query: { view: 'week', date: '2026-08-10', event: 'no_show' },
    })
    const blocked = await useCase.execute({
      actor,
      query: { view: 'week', date: '2026-08-10', event: 'blocked' },
    })

    expect(noShows).toMatchObject([{ kind: 'appointment', appointmentId: appointment.id }])
    expect(blocked).toMatchObject([{ kind: 'block', blockedPeriodId: block.id }])
    expect(appointmentsRepository.listOverlapping).toHaveBeenCalledTimes(2)
    expect(consultationProvider.getByAppointmentIds).toHaveBeenCalledTimes(2)
  })

  it('returns early for a lawyer filtering another calendar and omits unavailable projections', async () => {
    const useCase = new ListCalendarUseCase(
      schedulesRepository,
      appointmentsRepository,
      identityProvider,
      consultationProvider,
    )
    const deniedScope = await useCase.execute({
      actor: { collaboratorId: 'lawyer-1', profile: 'lawyer' },
      query: { view: 'week', date: '2026-08-10', event: 'all', lawyerId: 'lawyer-2' },
    })
    expect(deniedScope).toEqual([])
    expect(schedulesRepository.listByCollaboratorIds).not.toHaveBeenCalled()

    const schedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
    const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    schedulesRepository.listByCollaboratorIds.mockResolvedValue([schedule])
    schedulesRepository.listBlockedPeriods.mockResolvedValue([])
    appointmentsRepository.listOverlapping.mockResolvedValue([appointment])
    identityProvider.getClients.mockResolvedValue(new Map())
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
    )
    consultationProvider.getByAppointmentIds.mockResolvedValue(new Map())
    const missingProjection = await useCase.execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      query: { view: 'month', date: '2026-08-10', event: 'scheduled' },
    })

    expect(missingProjection).toEqual([])
  })
})
