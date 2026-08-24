import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '#consultation/domain/entities/fakers'
import {
  ConsultationDecision,
  ConsultationModality,
  ConsultationStatus,
  ConsultationViability,
} from '#consultation/domain/structures'
import { CollaboratorProfile } from '#identity/domain/structures'
import type { ConsultationsRepository } from '#consultation/interfaces'
import type {
  Broker,
  DatetimeProvider,
  DynamicFormsRepository,
  IdProvider,
} from '#shared/interfaces'

import type { FinalizeConsultationAttendanceRequest } from '../finalize-consultation-attendance-use-case'
import { FinalizeConsultationAttendanceUseCase } from '../finalize-consultation-attendance-use-case'

describe('Finalize Consultation Attendance Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let dynamicFormsRepository: MockProxy<DynamicFormsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let idProvider: MockProxy<IdProvider>
  let broker: MockProxy<Broker>

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    dynamicFormsRepository = mock<DynamicFormsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    idProvider = mock<IdProvider>()
    broker = mock<Broker>()
  })

  it('rejects closing without a contract unless the consultation is not viable', async () => {
    const consultation = makePendingConsultation()
    consultationsRepository.findById.mockResolvedValue(consultation)

    await expect(
      makeUseCase().execute({
        ...makeRequest(consultation),
        viability: ConsultationViability.Viable,
        decision: ConsultationDecision.CloseWithoutContract,
      }),
    ).rejects.toThrow(
      'Para encerrar sem contratação, selecione a classificação "Inviável".',
    )

    expect(consultationsRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects proceeding to contracting when the consultation is not viable', async () => {
    const consultation = makePendingConsultation()
    consultationsRepository.findById.mockResolvedValue(consultation)

    await expect(
      makeUseCase().execute({
        ...makeRequest(consultation),
        viability: ConsultationViability.NotViable,
        decision: ConsultationDecision.ProceedToContracting,
      }),
    ).rejects.toThrow('Para esta decisão, selecione "Viável" ou "Viável com ressalvas".')

    expect(consultationsRepository.replace).not.toHaveBeenCalled()
  })

  it('allows a new consultation when the classification is viable', async () => {
    const consultation = makePendingConsultation()
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(consultation)

    const result = await makeUseCase().execute({
      ...makeRequest(consultation),
      viability: ConsultationViability.ViableWithReservations,
      decision: ConsultationDecision.NewConsultation,
    })

    expect(result).toBe(consultation)
    expect(consultationsRepository.replace).toHaveBeenCalled()
  })

  it("allows an administrator to finalize another lawyer's consultation", async () => {
    const consultation = makePendingConsultation()
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(consultation)

    const result = await makeUseCase().execute({
      ...makeRequest(consultation),
      collaboratorId: 'administrator-id',
      collaboratorProfile: CollaboratorProfile.Admin,
    })

    expect(result).toBe(consultation)
    expect(consultationsRepository.replace).toHaveBeenCalled()
  })

  it('rejects a non-admin collaborator who is not the assigned lawyer', async () => {
    const consultation = makePendingConsultation()
    consultationsRepository.findById.mockResolvedValue(consultation)

    await expect(
      makeUseCase().execute({
        ...makeRequest(consultation),
        collaboratorId: 'other-collaborator-id',
        collaboratorProfile: CollaboratorProfile.Paralegal,
      }),
    ).rejects.toThrow(
      'Somente o advogado associado ou um administrador pode finalizar a ficha de atendimento.',
    )

    expect(consultationsRepository.replace).not.toHaveBeenCalled()
  })

  it('publishes a domain event when the legal context changes', async () => {
    const consultation = makePendingConsultation()
    const updatedConsultation = {
      ...consultation,
      legalAreaId: '11111111-1111-4111-8111-111111111111',
      legalTopicId: '22222222-2222-4222-8222-222222222222',
    }
    const occurredAt = new Date('2026-08-19T12:00:00.000Z')
    consultationsRepository.findById.mockResolvedValue(consultation)
    consultationsRepository.replace.mockResolvedValue(updatedConsultation)
    datetimeProvider.now.mockReturnValue(occurredAt)

    await makeUseCase().execute({
      ...makeRequest(consultation),
      legalAreaId: updatedConsultation.legalAreaId,
      legalTopicId: updatedConsultation.legalTopicId,
    })

    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'consultation/consultation.legal-context-updated',
        payload: expect.objectContaining({
          consultationId: consultation.id,
          intakeId: consultation.intakeId,
          legalAreaId: updatedConsultation.legalAreaId,
          legalTopicId: updatedConsultation.legalTopicId,
          updatedBy: consultation.assignedLawyerId,
          occurredAt,
        }),
      }),
    )
  })

  function makeUseCase() {
    return new FinalizeConsultationAttendanceUseCase(
      consultationsRepository,
      dynamicFormsRepository,
      datetimeProvider,
      idProvider,
      broker,
    )
  }
})

function makePendingConsultation() {
  return ConsultationFaker.fake({
    status: ConsultationStatus.Pending,
  })
}

function makeRequest(
  consultation: ReturnType<typeof makePendingConsultation>,
): FinalizeConsultationAttendanceRequest {
  return {
    consultationId: consultation.id,
    collaboratorId: consultation.assignedLawyerId,
    collaboratorProfile: CollaboratorProfile.Lawyer,
    legalAreaId: consultation.legalAreaId!,
    legalTopicId: consultation.legalTopicId!,
    modality: ConsultationModality.InPerson,
    primaryLegalQuestion: 'Qual é a orientação aplicável?',
    guidanceProvided: 'A orientação foi prestada ao cliente.',
    viability: ConsultationViability.Viable,
    decision: ConsultationDecision.ProceedToContracting,
  }
}
