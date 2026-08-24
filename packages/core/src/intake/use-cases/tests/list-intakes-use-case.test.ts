import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  ContactChannel,
  IntakeListStatus,
  IntakeOrigin,
  type IntakeListRow,
} from '../../domain/structures'
import type {
  IntakeClientsRepository,
  IntakeResponsiblesRepository,
} from '../../../identity/interfaces'
import type { IntakeListRepository } from '../../interfaces'
import { ListIntakesUseCase } from '../list-intakes-use-case'

describe('List Intakes Use Case', () => {
  let intakeListRepository: MockProxy<IntakeListRepository>
  let intakeClientsRepository: MockProxy<IntakeClientsRepository>
  let intakeResponsiblesRepository: MockProxy<IntakeResponsiblesRepository>

  beforeEach(() => {
    intakeListRepository = mock<IntakeListRepository>()
    intakeClientsRepository = mock<IntakeClientsRepository>()
    intakeResponsiblesRepository = mock<IntakeResponsiblesRepository>()
  })

  it('normalizes the query and hydrates the list rows', async () => {
    const row: IntakeListRow = {
      intakeId: 'intake-1',
      sequenceNumber: 11,
      clientId: 'client-1',
      responsibleId: 'responsible-1',
      origin: IntakeOrigin.Direct,
      contactChannel: ContactChannel.Email,
      demandNotes: 'Demanda de teste',
      status: IntakeListStatus.Contracted,
      createdAt: new Date('2026-08-03T12:00:00.000Z'),
    }
    const page = {
      items: [row],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      statusCounts: {
        all: 1,
        byStatus: {
          [IntakeListStatus.ConsultationScheduling]: 0,
          [IntakeListStatus.ConsultationSchedulingFailed]: 0,
          [IntakeListStatus.ConsultationScheduled]: 0,
          [IntakeListStatus.ConsultationCompleted]: 0,
          [IntakeListStatus.ViabilityRegistered]: 0,
          [IntakeListStatus.InFormalization]: 0,
          [IntakeListStatus.Contracted]: 1,
          [IntakeListStatus.ClosedWithoutContract]: 0,
        },
        compatibility: { registered: 0 },
      },
    }
    intakeListRepository.list.mockResolvedValue(page)
    intakeClientsRepository.findClientIdsBySearch.mockResolvedValue(['client-1'])
    intakeClientsRepository.findClientsByIds.mockResolvedValue([
      { clientId: 'client-1', name: 'Cliente Teste', maskedTaxId: '***.***.***-25' },
    ])
    intakeResponsiblesRepository.findResponsiblesByIds.mockResolvedValue([
      { responsibleId: 'responsible-1', professionalName: 'Responsável Teste' },
    ])

    const useCase = new ListIntakesUseCase(
      intakeListRepository,
      intakeClientsRepository,
      intakeResponsiblesRepository,
    )

    await expect(
      useCase.execute({
        search: '  cliente  ',
        status: IntakeListStatus.Contracted,
        responsibleId: '  responsible-1  ',
        registeredFrom: '2026-08-01',
        registeredTo: '2026-08-03',
        page: 0,
        pageSize: 101,
      }),
    ).resolves.toEqual({
      ...page,
      items: [
        {
          intakeId: 'intake-1',
          displayId: 'INT-0011',
          createdAt: row.createdAt,
          client: {
            clientId: 'client-1',
            name: 'Cliente Teste',
            maskedTaxId: '***.***.***-25',
          },
          responsible: {
            responsibleId: 'responsible-1',
            professionalName: 'Responsável Teste',
          },
          demandNotes: 'Demanda de teste',
          origin: IntakeOrigin.Direct,
          contactChannel: ContactChannel.Email,
          status: IntakeListStatus.Contracted,
        },
      ],
    })

    expect(intakeListRepository.list).toHaveBeenCalledWith({
      search: 'cliente',
      clientIds: ['client-1'],
      status: IntakeListStatus.Contracted,
      responsibleId: 'responsible-1',
      registeredFrom: '2026-08-01',
      registeredTo: '2026-08-03',
      page: 1,
      pageSize: 100,
    })
  })

  it('keeps rows when identity projections cannot be resolved', async () => {
    const page = {
      items: [
        {
          intakeId: 'intake-1',
          sequenceNumber: 1,
          clientId: 'missing-client',
          responsibleId: 'missing-responsible',
          origin: IntakeOrigin.Direct,
          contactChannel: ContactChannel.Email,
          status: IntakeListStatus.Contracted,
          createdAt: new Date('2026-08-03T12:00:00.000Z'),
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      statusCounts: {
        all: 1,
        byStatus: {
          [IntakeListStatus.ConsultationScheduling]: 0,
          [IntakeListStatus.ConsultationSchedulingFailed]: 0,
          [IntakeListStatus.ConsultationScheduled]: 0,
          [IntakeListStatus.ConsultationCompleted]: 0,
          [IntakeListStatus.ViabilityRegistered]: 0,
          [IntakeListStatus.InFormalization]: 0,
          [IntakeListStatus.Contracted]: 0,
          [IntakeListStatus.ClosedWithoutContract]: 0,
        },
        compatibility: { registered: 0 },
      },
    }
    intakeListRepository.list.mockResolvedValue(page)
    intakeClientsRepository.findClientsByIds.mockResolvedValue([])
    intakeResponsiblesRepository.findResponsiblesByIds.mockResolvedValue([])

    const useCase = new ListIntakesUseCase(
      intakeListRepository,
      intakeClientsRepository,
      intakeResponsiblesRepository,
    )

    await expect(useCase.execute()).resolves.toEqual({
      ...page,
      items: [
        expect.objectContaining({
          client: {
            clientId: 'missing-client',
            name: 'Cliente não encontrado',
            maskedTaxId: '—',
          },
          responsible: {
            responsibleId: 'missing-responsible',
            professionalName: 'Atendente não encontrado',
          },
        }),
      ],
    })
  })
})
