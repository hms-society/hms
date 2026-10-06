import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '#consultation/domain/entities/fakers'
import { ConsultationCompletedEvent } from '#consultation/domain/events'
import type { Consultation } from '#consultation/domain/entities/consultation'
import { ConsultationStatus } from '#consultation/domain/structures'
import type { DocumentPackagesRepository } from '#document-production/interfaces'
import { CollaboratorProfile } from '#identity/domain/structures'
import type {
  AppointmentWriteTransactionProvider,
  Broker,
  DatetimeProvider,
  IdProvider,
} from '#shared/interfaces'
import type {
  ConsultationOutboxRepository,
  ConsultationsRepository,
} from '../../interfaces'
import { CompleteConsultationUseCase } from '../complete-consultation-use-case'

describe('Complete Consultation Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let broker: MockProxy<Broker>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let appointmentTransactionProvider: MockProxy<AppointmentWriteTransactionProvider>
  let outboxRepository: MockProxy<ConsultationOutboxRepository>
  let idProvider: MockProxy<IdProvider>

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    broker = mock<Broker>()
    datetimeProvider = mock<DatetimeProvider>()
    appointmentTransactionProvider = mock<AppointmentWriteTransactionProvider>()
    outboxRepository = mock<ConsultationOutboxRepository>()
    idProvider = mock<IdProvider>()
  })

  it('rejects completion when the locked appointment was cancelled', async () => {
    const consultation = ConsultationFaker.fake()
    consultationsRepository.findById.mockResolvedValue(consultation)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_appointmentId, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'cancelled' }),
    )

    await expect(
      makeUseCase().execute({
        consultationId: consultation.id,
        collaboratorId: consultation.assignedLawyerId,
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).rejects.toThrow('A consulta não pode avançar porque o agendamento foi cancelado.')

    expect(consultationsRepository.replace).not.toHaveBeenCalled()
    expect(outboxRepository.add).not.toHaveBeenCalled()
  })

  it('completes inside the appointment lock and queues the domain event', async () => {
    const consultation = ConsultationFaker.fake({
      attendanceFinalizedAt: new Date('2026-08-19T11:00:00.000Z'),
    })
    const completedAt = new Date('2026-08-19T12:00:00.000Z')
    const completed = {
      ...consultation,
      status: ConsultationStatus.Completed,
      primaryLegalQuestion: 'Qual é a orientação aplicável?',
      guidanceProvided: 'A orientação foi prestada.',
      completedAt,
    } as Consultation
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(completed)
    documentPackagesRepository.findByContext.mockResolvedValue({
      confirmedAt: new Date('2026-08-19T11:30:00.000Z'),
    } as Awaited<ReturnType<DocumentPackagesRepository['findByContext']>>)
    datetimeProvider.now.mockReturnValue(completedAt)
    idProvider.generate.mockReturnValue('outbox-event-id')
    outboxRepository.add.mockImplementation(async (event) => event)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_appointmentId, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'scheduled' }),
    )

    const result = await makeUseCase().execute({
      consultationId: consultation.id,
      collaboratorId: consultation.assignedLawyerId,
      collaboratorProfile: CollaboratorProfile.Lawyer,
    })

    expect(result).toBe(completed)
    expect(consultationsRepository.replace).toHaveBeenCalledWith(consultation.id, {
      status: ConsultationStatus.Completed,
      completedAt,
    })
    expect(outboxRepository.add).toHaveBeenCalledWith({
      id: 'outbox-event-id',
      consultationId: completed.id,
      name: ConsultationCompletedEvent._NAME,
      payload: {
        consultationId: completed.id,
        intakeId: completed.intakeId,
        completedBy: consultation.assignedLawyerId,
        occurredAt: completedAt.toISOString(),
      },
      occurredAt: completedAt,
    })
    expect(broker.publish).not.toHaveBeenCalled()
  })

  function makeUseCase() {
    return new CompleteConsultationUseCase(
      consultationsRepository,
      documentPackagesRepository,
      broker,
      datetimeProvider,
      appointmentTransactionProvider,
      outboxRepository,
      idProvider,
    )
  }
})
