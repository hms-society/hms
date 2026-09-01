import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { LegalCasesRepository } from '../../interfaces'
import { ListMyLegalCasesUseCase } from '../list-my-legal-cases-use-case'

describe('List My Legal Cases Use Case', () => {
  let repository: MockProxy<LegalCasesRepository>
  let useCase: ListMyLegalCasesUseCase

  beforeEach(() => {
    repository = mock<LegalCasesRepository>()
    useCase = new ListMyLegalCasesUseCase(repository)
  })

  it('lists cases assigned to the current collaborator team', async () => {
    repository.listByTeamMember.mockResolvedValue([
      {
        id: 'case-1',
        publicCode: 'CASO-20260825-0001',
        title: 'Revisao contratual',
        status: 'documentation',
        clientName: 'Cliente HMS Teste',
        legalArea: 'Cível',
        legalTopic: 'Contratos',
        openedAt: new Date('2026-08-25T12:00:00.000Z'),
        updatedAt: new Date('2026-08-25T12:30:00.000Z'),
        checklistGate: {},
        dossierGate: {},
        team: [
          {
            collaboratorId: 'collaborator-1',
            name: 'Advogado de desenvolvimento',
            role: 'lead_lawyer',
            isPrimary: true,
          },
        ],
      },
    ])

    const cases = await useCase.execute({ collaboratorId: 'collaborator-1' })

    expect(repository.listByTeamMember).toHaveBeenCalledWith('collaborator-1')
    expect(cases).toHaveLength(1)
    expect(cases[0].team[0].collaboratorId).toBe('collaborator-1')
  })
})
