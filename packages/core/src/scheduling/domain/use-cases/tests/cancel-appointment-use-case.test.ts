import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { AppointmentFaker, ScheduleFaker } from '../../entities/fakers'
import type {
  CalendarConsultationProvider,
  CalendarIdentityProvider,
  IdProvider,
} from '#shared/interfaces'
import type {
  CalendarAppointmentsRepository,
  CalendarSchedulesRepository,
  SchedulingDatabase,
} from '../../../interfaces'
import { CancelAppointmentUseCase } from '../cancel-appointment-use-case'

describe('Cancel Appointment Use Case', () => {
  let appointmentsRepository: MockProxy<CalendarAppointmentsRepository>
  let schedulesRepository: MockProxy<CalendarSchedulesRepository>
  let database: MockProxy<SchedulingDatabase>
  let identityProvider: MockProxy<CalendarIdentityProvider>
  let consultationProvider: MockProxy<CalendarConsultationProvider>
  let idProvider: MockProxy<IdProvider>

  beforeEach(() => {
    appointmentsRepository = mock<CalendarAppointmentsRepository>()
    schedulesRepository = mock<CalendarSchedulesRepository>()
    database = mock<SchedulingDatabase>()
    identityProvider = mock<CalendarIdentityProvider>()
    consultationProvider = mock<CalendarConsultationProvider>()
    idProvider = mock<IdProvider>()
    idProvider.generate.mockReturnValue('change-1')
    database.run.mockImplementation(async (operation) =>
      operation({ appointmentsRepository, schedulesRepository }),
    )
  })

  it.each([
    0, -1,
  ])('records one cancellation change and advances the revision when the clock is %s ms from the previous revision', async (clockOffset) => {
    const schedule = ScheduleFaker.fake()
    let appointment = AppointmentFaker.fake({ scheduleId: schedule.id })
    const previousRevision = appointment.updatedAt
    const lockOrder: string[] = []
    appointmentsRepository.findByIdForUpdate.mockImplementation(async () => {
      lockOrder.push('appointment')
      return appointment
    })
    appointmentsRepository.findById.mockImplementation(async () => appointment)
    appointmentsRepository.replaceIfRevisionMatches.mockImplementation(
      async (_id, _revision, changes) => {
        appointment = { ...appointment, ...changes }
        return appointment
      },
    )
    schedulesRepository.findByIdForUpdate.mockImplementation(async () => {
      lockOrder.push('schedule')
      return schedule
    })
    schedulesRepository.findById.mockResolvedValue(schedule)
    appointmentsRepository.listChanges.mockResolvedValue([])
    identityProvider.getClients.mockResolvedValue(
      new Map([[appointment.clientId, { name: 'Client' }]]),
    )
    identityProvider.getLawyers.mockResolvedValue(
      new Map([[schedule.collaboratorId, { name: 'Lawyer', active: true }]]),
    )
    identityProvider.getCollaborators.mockResolvedValue(new Map())
    consultationProvider.getByAppointmentIds.mockResolvedValue(new Map())

    const result = await new CancelAppointmentUseCase(
      database,
      schedulesRepository,
      identityProvider,
      consultationProvider,
      { now: () => new Date(previousRevision.getTime() + clockOffset) },
      idProvider,
      appointmentsRepository,
    ).execute({
      actor: { collaboratorId: 'attendant-1', profile: 'attendant' },
      appointmentId: appointment.id,
      expectedRevision: appointment.updatedAt,
    })

    expect(result.status).toBe('cancelled')
    expect(appointmentsRepository.addChange).toHaveBeenCalledTimes(1)
    const change = appointmentsRepository.addChange.mock.calls[0][0]
    expect(change.previousRevision).toEqual(previousRevision)
    expect(change.resultingRevision.getTime()).toBeGreaterThan(previousRevision.getTime())
    expect(result.updatedAt).toEqual(change.resultingRevision)
    expect(result.cancelledAt).toEqual(change.resultingRevision)
    expect(lockOrder).toEqual(['schedule', 'appointment'])
  })
})
