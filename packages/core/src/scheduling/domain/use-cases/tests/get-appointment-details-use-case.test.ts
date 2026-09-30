import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { AppointmentFaker, ScheduleFaker } from '../../entities/fakers'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
} from '#shared/interfaces'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
} from '../../../interfaces'
import { GetAppointmentDetailsUseCase } from '../get-appointment-details-use-case'

describe('Get Appointment Details Use Case', () => {
  let appointmentsRepository: MockProxy<CalendarAppointmentsRepository>
  let schedulesRepository: MockProxy<CalendarSchedulesRepository>
  let identityProvider: MockProxy<CalendarIdentityProvider>
  let consultationProvider: MockProxy<CalendarConsultationProvider>

  beforeEach(() => {
    appointmentsRepository = mock<CalendarAppointmentsRepository>()
    schedulesRepository = mock<CalendarSchedulesRepository>()
    identityProvider = mock<CalendarIdentityProvider>()
    consultationProvider = mock<CalendarConsultationProvider>()
  })

  it('returns minimum details and consultation access for the responsible lawyer', async () => {
    const schedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
    const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    appointmentsRepository.findById.mockResolvedValue(appointment)
    appointmentsRepository.listChanges.mockResolvedValue([])
    schedulesRepository.findById.mockResolvedValue(schedule)
    identityProvider.getClients.mockResolvedValue(
      new Map([[appointment.clientId, { name: 'Client' }]]),
    )
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
    )
    identityProvider.getCollaborators.mockResolvedValue(new Map())
    consultationProvider.getByAppointmentIds.mockResolvedValue(
      new Map([[appointment.id, { id: 'consultation-1', status: 'pending' }]]),
    )

    const result = await new GetAppointmentDetailsUseCase(
      appointmentsRepository,
      schedulesRepository,
      identityProvider,
      consultationProvider,
    ).execute({
      actor: { collaboratorId: schedule.collaboratorId, profile: 'lawyer' },
      appointmentId: appointment.id,
    })

    expect(result).toMatchObject({
      consultationId: 'consultation-1',
      clientName: 'Client',
    })
  })

  it.each([
    'attendant',
    'supervisor',
    'paralegal',
  ] as const)('exposes consultation status and start indicators to %s without the consultation ID', async (profile) => {
    const schedule = ScheduleFaker.fake({ collaboratorId: 'lawyer-1' })
    const appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    const startedAt = new Date('2026-08-13T13:05:00.000Z')
    appointmentsRepository.findById.mockResolvedValue(appointment)
    appointmentsRepository.listChanges.mockResolvedValue([])
    schedulesRepository.findById.mockResolvedValue(schedule)
    identityProvider.getClients.mockResolvedValue(
      new Map([[appointment.clientId, { name: 'Client' }]]),
    )
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
    )
    identityProvider.getCollaborators.mockResolvedValue(new Map())
    consultationProvider.getByAppointmentIds.mockResolvedValue(
      new Map([[appointment.id, { id: 'consultation-1', status: 'no_show', startedAt }]]),
    )

    const result = await new GetAppointmentDetailsUseCase(
      appointmentsRepository,
      schedulesRepository,
      identityProvider,
      consultationProvider,
    ).execute({
      actor: { collaboratorId: `${profile}-1`, profile },
      appointmentId: appointment.id,
    })

    expect(result).toMatchObject({
      consultationStatus: 'no_show',
      consultationStartedAt: startedAt,
    })
    expect(result).not.toHaveProperty('consultationId')
  })
})
