import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '#consultation/domain/entities/fakers'
import type { ConsultationsRepository } from '#consultation/interfaces'
import type { ClientsRepository, CollaboratorsRepository } from '#identity/interfaces'
import type { IntakesRepository } from '#intake/interfaces'
import type { AppointmentsRepository } from '#scheduling/interfaces'

import { GetConsultationUseCase } from '../get-consultation-use-case'

describe('Get Consultation Use Case', () => {
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

  it('returns the consultation and its available context', async () => {
    const consultation = ConsultationFaker.fake()
    const intake = { id: consultation.intakeId } as Awaited<
      ReturnType<IntakesRepository['findById']>
    >
    const client = { id: consultation.clientId } as Awaited<
      ReturnType<ClientsRepository['findById']>
    >
    const responsible = { collaboratorId: consultation.assignedLawyerId } as Awaited<
      ReturnType<CollaboratorsRepository['findSummaryById']>
    >
    const appointment = { id: consultation.appointmentId } as Awaited<
      ReturnType<AppointmentsRepository['findByIntakeId']>
    >

    consultationsRepository.findById.mockResolvedValue(consultation)
    intakesRepository.findById.mockResolvedValue(intake)
    clientsRepository.findById.mockResolvedValue(client)
    collaboratorsRepository.findSummaryById.mockResolvedValue(responsible)
    appointmentsRepository.findByIntakeId.mockResolvedValue(appointment)

    const result = await new GetConsultationUseCase(
      consultationsRepository,
      intakesRepository,
      clientsRepository,
      collaboratorsRepository,
      appointmentsRepository,
    ).execute({ consultationId: consultation.id })

    expect(result).toMatchObject({
      ...consultation,
      intake,
      client,
      responsible,
      appointment,
    })
    expect(collaboratorsRepository.findSummaryById).toHaveBeenCalledWith(
      consultation.assignedLawyerId,
    )
  })

  it('raises not found when the consultation does not exist', async () => {
    consultationsRepository.findById.mockResolvedValue(undefined)

    await expect(
      new GetConsultationUseCase(
        consultationsRepository,
        intakesRepository,
        clientsRepository,
        collaboratorsRepository,
        appointmentsRepository,
      ).execute({ consultationId: 'missing-consultation-id' }),
    ).rejects.toThrow('Consulta não encontrada.')
  })
})
