import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { ClientsRepository } from '../../../identity/interfaces/clients-repository'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '../../../legal-catalog/interfaces'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import { CaseMemberRole } from '../../domain/structures'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { ListMyLegalCasesUseCase } from '../list-my-legal-cases-use-case'

describe('List My Legal Cases Use Case', () => {
  let repository: MockProxy<LegalCasesRepository>
  let clients: MockProxy<ClientsRepository>
  let areas: MockProxy<LegalAreasRepository>
  let topics: MockProxy<LegalTopicsRepository>
  let members: MockProxy<CaseMembersRepository>
  let collaborators: MockProxy<CaseCollaboratorsProvider>
  let useCase: ListMyLegalCasesUseCase

  beforeEach(() => {
    repository = mock<LegalCasesRepository>()
    clients = mock<ClientsRepository>()
    areas = mock<LegalAreasRepository>()
    topics = mock<LegalTopicsRepository>()
    members = mock<CaseMembersRepository>()
    collaborators = mock<CaseCollaboratorsProvider>()
    clients.findById.mockResolvedValue({ type: 'natural', name: 'Cliente HMS' } as never)
    areas.findById.mockResolvedValue({ name: 'Cível' } as never)
    topics.findById.mockResolvedValue({ name: 'Contratos' } as never)
    members.listByCaseId.mockResolvedValue([
      {
        id: 'membership-1',
        caseId: 'case-1',
        collaboratorId: 'collaborator-1',
        role: CaseMemberRole.Manager,
        assignedAt: new Date(),
        assignedBy: 'actor-1',
        archivedLegacy: false,
        createdAt: new Date(),
      },
    ])
    collaborators.findById.mockResolvedValue({
      collaboratorId: 'collaborator-1',
      professionalName: 'Advogado de desenvolvimento',
      email: 'lawyer@example.com',
      profile: 'lawyer',
      status: 'active',
    })
    useCase = new ListMyLegalCasesUseCase(
      repository,
      clients,
      areas,
      topics,
      members,
      collaborators,
    )
  })

  it('lists active cases assigned to the current collaborator and projects each summary', async () => {
    const legalCase = LegalCaseFaker.fake({
      id: 'case-1',
      clientId: 'client-1',
      legalAreaId: 'area-1',
      legalTopicId: 'topic-1',
    })
    repository.listByTeamMember.mockResolvedValue([legalCase])

    const cases = await useCase.execute({ collaboratorId: 'collaborator-1' })

    expect(repository.listByTeamMember).toHaveBeenCalledWith('collaborator-1', undefined)
    expect(cases).toHaveLength(1)
    expect(cases[0].team[0].collaboratorId).toBe('collaborator-1')
    expect(cases[0]).toMatchObject({
      clientName: 'Cliente HMS',
      legalArea: 'Cível',
      legalTopic: 'Contratos',
    })
  })

  it('uses clientId only as an additional case-list filter', async () => {
    repository.listByTeamMember.mockResolvedValue([])

    await useCase.execute({ collaboratorId: 'collaborator-1', clientId: 'client-1' })

    expect(repository.listByTeamMember).toHaveBeenCalledWith(
      'collaborator-1',
      'client-1',
    )
  })

  it('rejects collaborators who are not active', async () => {
    collaborators.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ collaboratorId: 'collaborator-1' }),
    ).rejects.toThrow('Acesso jurídico ao Caso não autorizado.')
    expect(repository.listByTeamMember).not.toHaveBeenCalled()
  })
})
