import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { AppointmentFaker, ScheduleFaker } from '../../entities/fakers'
import type { CalendarIdentityProvider } from '#shared/interfaces'
import { AppointmentActionForbiddenError, AppointmentConflictError } from '../../errors'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '../../../interfaces'
import { ListRescheduleSlotsUseCase } from '../list-reschedule-slots-use-case'

describe('List Reschedule Slots Use Case', () => {
  let appointmentsRepository: MockProxy<CalendarAppointmentsRepository>
  let schedulesRepository: MockProxy<CalendarSchedulesRepository>
  let identityProvider: MockProxy<CalendarIdentityProvider>

  beforeEach(() => {
    appointmentsRepository = mock<CalendarAppointmentsRepository>()
    schedulesRepository = mock<CalendarSchedulesRepository>()
    identityProvider = mock<CalendarIdentityProvider>()
  })

  it('lists future slots without reserving one', async () => {
    const schedule = ScheduleFaker.fake({
      collaboratorId: 'lawyer-1',
      appointmentDurationInMinutes: 45,
      weeklyAvailability: [
        { weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '10:30' }] },
      ],
    })
    const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    appointmentsRepository.findById.mockResolvedValue(appointment)
    appointmentsRepository.listOverlapping.mockResolvedValue([appointment])
    schedulesRepository.findById.mockResolvedValue(schedule)
    schedulesRepository.listBlockedPeriods.mockResolvedValue([])

    const result = await new ListRescheduleSlotsUseCase(
      appointmentsRepository,
      schedulesRepository,
      { now: () => new Date('2026-08-01T00:00:00Z') },
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      appointmentId: appointment.id,
      date: '2026-08-10',
    })

    expect(result.length).toBeGreaterThan(0)
    expect(appointmentsRepository.replaceIfRevisionMatches).not.toHaveBeenCalled()
  })

  it('uses the selected lawyer timezone and preserves the appointment duration', async () => {
    const currentSchedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-current' })
    const destinationSchedule = ScheduleFaker.fake({
      collaboratorId: 'lawyer-destination',
      timeZone: 'America/Los_Angeles',
      appointmentDurationInMinutes: 30,
      weeklyAvailability: [
        { weekday: 'monday', timeRanges: [{ startsAt: '09:00', endsAt: '10:00' }] },
      ],
    })
    const appointment = AppointmentFaker.fake({
      scheduleId: currentSchedule.id,
      startsAt: new Date('2026-08-10T12:00:00Z'),
      endsAt: new Date('2026-08-10T12:45:00Z'),
    })
    appointmentsRepository.findById.mockResolvedValue(appointment)
    appointmentsRepository.listOverlapping.mockResolvedValue([])
    schedulesRepository.findById.mockResolvedValue(currentSchedule)
    schedulesRepository.findByCollaboratorId.mockResolvedValue(destinationSchedule)
    schedulesRepository.listBlockedPeriods.mockResolvedValue([])
    identityProvider.getLawyers.mockResolvedValue(
      new Map([
        [
          destinationSchedule.collaboratorId,
          { name: 'Destination Lawyer', active: true },
        ],
      ]),
    )

    const slots = await new ListRescheduleSlotsUseCase(
      appointmentsRepository,
      schedulesRepository,
      { now: () => new Date('2026-08-09T00:00:00Z') },
      identityProvider,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      appointmentId: appointment.id,
      date: '2026-08-10',
      lawyerId: destinationSchedule.collaboratorId,
    })

    expect(slots[0]).toEqual({
      startsAt: new Date('2026-08-10T16:00:00Z'),
      endsAt: new Date('2026-08-10T16:45:00Z'),
      timeZone: 'America/Los_Angeles',
    })
    expect(slots).toHaveLength(2)
    expect(schedulesRepository.listBlockedPeriods).toHaveBeenCalledWith(
      [destinationSchedule.id],
      '2026-08-10',
      '2026-08-10',
    )
  })

  it('rejects inactive or unscheduled target lawyers and invalid civil dates', async () => {
    const currentSchedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-current' })
    const targetSchedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-target' })
    const appointment = AppointmentFaker.fake({ scheduleId: currentSchedule.id })
    appointmentsRepository.findById.mockResolvedValue(appointment)
    schedulesRepository.findById.mockResolvedValue(currentSchedule)
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[targetSchedule.collaboratorId, { name: 'Target', active: false }]]),
    )
    const useCase = new ListRescheduleSlotsUseCase(
      appointmentsRepository,
      schedulesRepository,
      { now: () => new Date('2026-08-01T00:00:00Z') },
      identityProvider,
    )
    const request = {
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' as const },
      appointmentId: appointment.id,
      date: '2026-08-10',
      lawyerId: targetSchedule.collaboratorId,
    }

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      AppointmentConflictError,
    )

    identityProvider.getLawyers.mockResolvedValue(
      new Map([[targetSchedule.collaboratorId, { name: 'Target', active: true }]]),
    )
    schedulesRepository.findByCollaboratorId.mockResolvedValue(null)
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      AppointmentConflictError,
    )

    const missingLawyerRequest = { ...request, lawyerId: undefined }
    schedulesRepository.findByCollaboratorId.mockClear()
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[currentSchedule.collaboratorId, { name: 'Current', active: true }]]),
    )
    await expect(
      useCase.execute({ ...missingLawyerRequest, date: '2026-02-30' }),
    ).rejects.toBeInstanceOf(AppointmentConflictError)
  })

  it('rejects roles without write access before reading the appointment', async () => {
    const useCase = new ListRescheduleSlotsUseCase(
      appointmentsRepository,
      schedulesRepository,
    )

    await expect(
      useCase.execute({
        actor: { collaboratorId: 'lawyer-1', profile: 'lawyer' },
        appointmentId: 'appointment-1',
        date: '2026-08-10',
      }),
    ).rejects.toBeInstanceOf(AppointmentActionForbiddenError)
    expect(appointmentsRepository.findById).not.toHaveBeenCalled()
  })
})
