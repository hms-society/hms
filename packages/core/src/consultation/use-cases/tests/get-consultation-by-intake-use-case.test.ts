import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '#consultation/domain/entities/fakers'
import type { ConsultationsRepository } from '#consultation/interfaces'
import type { ClientsRepository, CollaboratorsRepository } from '#identity/interfaces'
import { CollaboratorProfile } from '#identity/domain/structures'
import type { IntakesRepository } from '#intake/interfaces'
import type { AppointmentsRepository } from '#scheduling/interfaces'

import { GetConsultationByIntakeUseCase } from '../get-consultation-by-intake-use-case'

describe('Get Consultation By Intake Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let intakesRepository: MockProxy<IntakesRepository>
  let clientsRepository: MockProxy<ClientsRepository>
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let appointmentsRepository: MockProxy<AppointmentsRepository>

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    intakesRepository = mock<IntakesRepository>()
    clientsRepository = mock<ClientsRepository>()
    collaboratorsRepository = mock<CollaboratorsRepository>()
    appointmentsRepository = mock<AppointmentsRepository>()
  })

  it('returns the consultation context found through its intake', async () => {
    const consultation = ConsultationFaker.fake()
    const intake = { id: consultation.intakeId } as Awaited<
      ReturnType<IntakesRepository['findById']>
    >
    const client = { id: consultation.clientId } as Awaited<
      ReturnType<ClientsRepository['findById']>
    >
    const lawyer = { collaboratorId: consultation.assignedLawyerId } as Awaited<
      ReturnType<CollaboratorsRepository['findSummaryById']>
    >
    const appointment = { id: consultation.appointmentId } as Awaited<
      ReturnType<AppointmentsRepository['findByIntakeId']>
    >
    consultationsRepository.findByIntakeId.mockResolvedValue(consultation)
    consultationsRepository.findById.mockResolvedValue(consultation)
    intakesRepository.findById.mockResolvedValue(intake)
    clientsRepository.findById.mockResolvedValue(client)
    collaboratorsRepository.findSummaryById.mockResolvedValue(lawyer)
    appointmentsRepository.findByIntakeId.mockResolvedValue(appointment)

    const result = await makeUseCase().execute({ intakeId: consultation.intakeId })

    expect(result).toMatchObject({ ...consultation, intake, client, assignedLawyer: lawyer, appointment })
    expect(consultationsRepository.findByIntakeId).toHaveBeenCalledWith(consultation.intakeId)
  })

  it('does not reveal a consultation to an unrelated collaborator', async () => {
    const consultation = ConsultationFaker.fake()
    consultationsRepository.findByIntakeId.mockResolvedValue(consultation)
    consultationsRepository.findById.mockResolvedValue(consultation)

    await expect(
      makeUseCase().execute({
        intakeId: consultation.intakeId,
        actor: {
          collaboratorId: 'unrelated-collaborator-id',
          profile: CollaboratorProfile.Lawyer,
        },
      }),
    ).rejects.toThrow('Consulta não encontrada.')

    expect(intakesRepository.findById).not.toHaveBeenCalled()
    expect(clientsRepository.findById).not.toHaveBeenCalled()
    expect(collaboratorsRepository.findSummaryById).not.toHaveBeenCalled()
    expect(appointmentsRepository.findByIntakeId).not.toHaveBeenCalled()
  })

  function makeUseCase() {
    return new GetConsultationByIntakeUseCase(
      consultationsRepository,
      intakesRepository,
      clientsRepository,
      collaboratorsRepository,
      appointmentsRepository,
    )
  }
})
