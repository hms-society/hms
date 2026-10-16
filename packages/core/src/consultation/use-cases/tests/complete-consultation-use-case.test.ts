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

  it('completes without a document package inside the appointment lock and queues the domain event', async () => {
    const consultation = ConsultationFaker.fake({
      attendanceFinalizedAt: new Date('2026-08-19T11:00:00.000Z'),
    })
    const completedAt = new Date('2026-08-19T12:00:00.000Z')
    const completed = {
      id: consultation.id,
      clientId: consultation.clientId,
      intakeId: consultation.intakeId,
      appointmentId: consultation.appointmentId,
      assignedLawyerId: consultation.assignedLawyerId,
      status: ConsultationStatus.Completed,
      primaryLegalQuestion: 'Qual é a orientação aplicável?',
      guidanceProvided: 'A orientação foi prestada.',
      completedAt,
    } as Consultation
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(completed)
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
    expect(documentPackagesRepository.findByContext).not.toHaveBeenCalled()
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
  it('completes without a package through the direct broker path when no appointment transaction is configured', async () => {
    const consultation = ConsultationFaker.fake({ attendanceFinalizedAt: new Date() })
    const completed = ConsultationFaker.fake({
      id: consultation.id,
      clientId: consultation.clientId,
      intakeId: consultation.intakeId,
      appointmentId: consultation.appointmentId,
      assignedLawyerId: consultation.assignedLawyerId,
      status: ConsultationStatus.Completed,
      completedAt: new Date(),
      primaryLegalQuestion: 'Questão apresentada',
      guidanceProvided: 'Orientação apresentada',
    })
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(completed)
    datetimeProvider.now.mockReturnValue(completed.completedAt as Date)
    const useCase = new CompleteConsultationUseCase(
      consultationsRepository,
      documentPackagesRepository,
      broker,
      datetimeProvider,
    )
    expect(
      await useCase.execute({
        consultationId: consultation.id,
        collaboratorId: consultation.assignedLawyerId,
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).toBe(completed)
    expect(documentPackagesRepository.findByContext).not.toHaveBeenCalled()
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          consultationId: consultation.id,
          completedBy: consultation.assignedLawyerId,
        }),
      }),
    )
  })
  it.each([
    false,
    true,
  ])('rejects a missing consultation with appointment transaction configured: %s', async (locked) => {
    consultationsRepository.findById.mockResolvedValue(undefined)
    const useCase = locked
      ? makeUseCase()
      : new CompleteConsultationUseCase(
          consultationsRepository,
          documentPackagesRepository,
          broker,
          datetimeProvider,
        )
    await expect(
      useCase.execute({
        consultationId: 'missing',
        collaboratorId: 'actor',
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).rejects.toThrow()
    expect(consultationsRepository.replace).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })
  it.each([
    false,
    true,
  ])('rejects an unassigned lawyer with appointment transaction configured: %s', async (locked) => {
    const consultation = ConsultationFaker.fake({ attendanceFinalizedAt: new Date() })
    consultationsRepository.findById.mockResolvedValue(consultation)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_id, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'scheduled' }),
    )
    const useCase = locked
      ? makeUseCase()
      : new CompleteConsultationUseCase(
          consultationsRepository,
          documentPackagesRepository,
          broker,
          datetimeProvider,
        )
    await expect(
      useCase.execute({
        consultationId: consultation.id,
        collaboratorId: 'other-lawyer',
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).rejects.toThrow()
    expect(consultationsRepository.replace).not.toHaveBeenCalled()
    expect(outboxRepository.add).not.toHaveBeenCalled()
  })
  it.each([
    false,
    true,
  ])('rejects replaying an already completed stage with appointment transaction configured: %s', async (locked) => {
    const consultation = ConsultationFaker.fake({
      status: ConsultationStatus.Completed,
      completedAt: new Date(),
      attendanceFinalizedAt: new Date(),
    })
    consultationsRepository.findById.mockResolvedValue(consultation)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_id, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'scheduled' }),
    )
    const useCase = locked
      ? makeUseCase()
      : new CompleteConsultationUseCase(
          consultationsRepository,
          documentPackagesRepository,
          broker,
          datetimeProvider,
        )
    await expect(
      useCase.execute({
        consultationId: consultation.id,
        collaboratorId: consultation.assignedLawyerId,
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).rejects.toThrow()
    expect(consultationsRepository.replace).not.toHaveBeenCalled()
  })
  it.each([
    false,
    true,
  ])('requires finalized attendance even without the obsolete package gate, transaction configured: %s', async (locked) => {
    const consultation = ConsultationFaker.fake({ attendanceFinalizedAt: undefined })
    consultationsRepository.findById.mockResolvedValue(consultation)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_id, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'scheduled' }),
    )
    const useCase = locked
      ? makeUseCase()
      : new CompleteConsultationUseCase(
          consultationsRepository,
          documentPackagesRepository,
          broker,
          datetimeProvider,
        )
    await expect(
      useCase.execute({
        consultationId: consultation.id,
        collaboratorId: consultation.assignedLawyerId,
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).rejects.toThrow()
    expect(documentPackagesRepository.findByContext).not.toHaveBeenCalled()
    expect(consultationsRepository.replace).not.toHaveBeenCalled()
  })
  it.each([
    false,
    true,
  ])('does not publish completion after failed persistence, transaction configured: %s', async (locked) => {
    const consultation = ConsultationFaker.fake({ attendanceFinalizedAt: new Date() })
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(undefined)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_id, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'scheduled' }),
    )
    const useCase = locked
      ? makeUseCase()
      : new CompleteConsultationUseCase(
          consultationsRepository,
          documentPackagesRepository,
          broker,
          datetimeProvider,
        )
    await expect(
      useCase.execute({
        consultationId: consultation.id,
        collaboratorId: consultation.assignedLawyerId,
        collaboratorProfile: CollaboratorProfile.Admin,
      }),
    ).rejects.toThrow()
    expect(broker.publish).not.toHaveBeenCalled()
    expect(outboxRepository.add).not.toHaveBeenCalled()
  })
  it('rechecks consultation existence after acquiring the appointment lock', async () => {
    const consultation = ConsultationFaker.fake({ attendanceFinalizedAt: new Date() })
    consultationsRepository.findById
      .mockResolvedValueOnce(consultation)
      .mockResolvedValueOnce(undefined)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_id, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'scheduled' }),
    )
    await expect(
      makeUseCase().execute({
        consultationId: consultation.id,
        collaboratorId: consultation.assignedLawyerId,
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).rejects.toThrow()
    expect(consultationsRepository.replace).not.toHaveBeenCalled()
  })
  it('does not require an outbox provider for a configured locked completion capability', async () => {
    const consultation = ConsultationFaker.fake({ attendanceFinalizedAt: new Date() })
    const completed = ConsultationFaker.fake({
      id: consultation.id,
      clientId: consultation.clientId,
      intakeId: consultation.intakeId,
      appointmentId: consultation.appointmentId,
      assignedLawyerId: consultation.assignedLawyerId,
      status: ConsultationStatus.Completed,
      completedAt: new Date(),
    })
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(completed)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_id, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'scheduled' }),
    )
    expect(
      await new CompleteConsultationUseCase(
        consultationsRepository,
        documentPackagesRepository,
        broker,
        datetimeProvider,
        appointmentTransactionProvider,
      ).execute({
        consultationId: consultation.id,
        collaboratorId: consultation.assignedLawyerId,
        collaboratorProfile: CollaboratorProfile.Admin,
      }),
    ).toBe(completed)
    expect(broker.publish).not.toHaveBeenCalled()
  })
  it('records a completion event with a deterministic fallback identifier when no ID provider is configured', async () => {
    const consultation = ConsultationFaker.fake({ attendanceFinalizedAt: new Date() })
    const completedAt = new Date('2026-10-12T12:00:00.000Z')
    const completed = ConsultationFaker.fake({
      id: consultation.id,
      clientId: consultation.clientId,
      intakeId: consultation.intakeId,
      appointmentId: consultation.appointmentId,
      assignedLawyerId: consultation.assignedLawyerId,
      status: ConsultationStatus.Completed,
      completedAt,
    })
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(completed)
    datetimeProvider.now.mockReturnValue(completedAt)
    appointmentTransactionProvider.runWithLockedAppointment.mockImplementation(
      async (_id, operation) =>
        operation({ appointmentId: consultation.appointmentId, status: 'scheduled' }),
    )
    expect(
      await new CompleteConsultationUseCase(
        consultationsRepository,
        documentPackagesRepository,
        broker,
        datetimeProvider,
        appointmentTransactionProvider,
        outboxRepository,
      ).execute({
        consultationId: consultation.id,
        collaboratorId: consultation.assignedLawyerId,
        collaboratorProfile: CollaboratorProfile.Lawyer,
      }),
    ).toBe(completed)
    expect(outboxRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: `${completed.id}:${completedAt.toISOString()}`,
        consultationId: completed.id,
      }),
    )
  })
})
