import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '#consultation/domain/entities/fakers'
import { ConsultationModality } from '#consultation/domain/structures'
import type { ConsultationsRepository } from '#consultation/interfaces'
import type { DatetimeProvider, IdProvider } from '#shared/interfaces'

import { CreateConsultationFromAppointmentUseCase } from '../create-consultation-from-appointment-use-case'

const currentDate = new Date('2026-08-12T15:00:00.000Z')
const consultationId = 'f7aab3e3-5474-4fdb-8d45-8508e44b7029'

describe('Create Consultation From Appointment Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let idProvider: MockProxy<IdProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    idProvider = mock<IdProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    idProvider.generate.mockReturnValue(consultationId)
    datetimeProvider.now.mockReturnValue(currentDate)
  })

  it('creates a pending Consultation for a scheduled Intake', async () => {
    const consultation = ConsultationFaker.fake({ id: consultationId })
    consultationsRepository.add.mockResolvedValue(consultation)
    const useCase = new CreateConsultationFromAppointmentUseCase(
      consultationsRepository,
      idProvider,
      datetimeProvider,
    )

    const result = await useCase.execute({
      intakeId: consultation.intakeId,
      appointmentId: consultation.appointmentId,
      clientId: consultation.clientId,
      assignedLawyerId: consultation.assignedLawyerId,
      legalAreaId: consultation.legalAreaId,
      legalTopicId: consultation.legalTopicId,
      demandNotes: 'Initial demand',
      modality: ConsultationModality.InPerson,
    })

    expect(result).toBe(consultation)
    expect(consultationsRepository.add).toHaveBeenCalledWith({
      id: consultationId,
      intakeId: consultation.intakeId,
      appointmentId: consultation.appointmentId,
      clientId: consultation.clientId,
      assignedLawyerId: consultation.assignedLawyerId,
      legalAreaId: consultation.legalAreaId,
      legalTopicId: consultation.legalTopicId,
      notes: 'Initial demand',
      relevantFacts: [],
      potentialLegalRequests: [],
      identifiedRisks: [],
      suggestions: [],
      modality: ConsultationModality.InPerson,
      status: 'pending',
      createdAt: currentDate,
      updatedAt: currentDate,
    })
  })

  it('returns the existing Consultation when the event is retried', async () => {
    const consultation = ConsultationFaker.fake()
    consultationsRepository.findByIntakeId.mockResolvedValue(consultation)
    const useCase = new CreateConsultationFromAppointmentUseCase(
      consultationsRepository,
      idProvider,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        intakeId: consultation.intakeId,
        appointmentId: consultation.appointmentId,
        clientId: consultation.clientId,
        assignedLawyerId: consultation.assignedLawyerId,
        legalAreaId: consultation.legalAreaId,
        legalTopicId: consultation.legalTopicId,
        modality: ConsultationModality.InPerson,
      }),
    ).resolves.toBe(consultation)
    expect(consultationsRepository.add).not.toHaveBeenCalled()
  })
})
