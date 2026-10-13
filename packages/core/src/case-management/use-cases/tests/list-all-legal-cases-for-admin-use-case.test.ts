import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ClientFaker } from '#identity/domain/entities/fakers'
import { LegalAreaFaker, LegalTopicFaker } from '#legal-catalog/domain/entities/fakers'
import type { LegalCaseOperationalRecord } from '../../domain/entities'
import { CollaboratorProfile } from '#identity/domain/structures'
import type { ClientsRepository } from '#identity/interfaces/clients-repository'
import type { CaseCollaboratorsProvider, LegalCasesRepository } from '../../interfaces'
import type { LegalAreasRepository } from '#legal-catalog/interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '#legal-catalog/interfaces/legal-topics-repository'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { PaginationResponse } from '#shared/responses/pagination-response'

import { ListAllLegalCasesForAdminUseCase } from '../list-all-legal-cases-for-admin-use-case'

describe('List All Legal Cases For Admin Use Case', () => {
  it('returns a paginated operational allowlist for Admin', async () => {
    const legalCasesRepository = makeLegalCasesRepository()
    const clientsRepository = makeClientsRepository()
    const useCase = makeUseCase({ legalCasesRepository, clientsRepository })

    const result = await useCase.execute({
      collaboratorProfile: CollaboratorProfile.Admin,
      query: { search: '  CLIENT  ', page: 2, pageSize: 50 },
    })

    expect(clientsRepository.findIdsByName).toHaveBeenCalledWith('CLIENT')
    expect(legalCasesRepository.listOperationalRecords).toHaveBeenCalledWith({
      matchingClientIds: ['client-1'],
      page: 2,
      pageSize: 50,
      search: 'CLIENT',
    })
    expect(result).toEqual(
      new PaginationResponse(
        [
          {
            id: 'case-1',
            publicCode: 'CASO-1',
            title: 'Case title',
            clientName: 'Client name',
            legalArea: 'Civil',
            legalTopic: 'Contracts',
            status: 'documentation',
            managerNames: ['Manager name'],
            updatedAt: new Date('2026-10-01T00:00:00.000Z'),
          },
        ],
        2,
        50,
        51,
        2,
      ),
    )
    expect(Object.keys(result.items[0])).toEqual([
      'id',
      'publicCode',
      'title',
      'clientName',
      'legalArea',
      'legalTopic',
      'status',
      'managerNames',
      'updatedAt',
    ])
  })

  it('rejects non-Admins before reading Clients or Cases', async () => {
    const legalCasesRepository = makeLegalCasesRepository()
    const clientsRepository = makeClientsRepository()
    const useCase = makeUseCase({ legalCasesRepository, clientsRepository })

    await expect(
      useCase.execute({
        collaboratorProfile: CollaboratorProfile.Lawyer,
        query: { page: 1, pageSize: 50 },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(clientsRepository.findIdsByName).not.toHaveBeenCalled()
    expect(legalCasesRepository.listOperationalRecords).not.toHaveBeenCalled()
  })

  it('skips Client-name lookup for an unfiltered list', async () => {
    const clientsRepository = makeClientsRepository()
    const legalCasesRepository = makeLegalCasesRepository()
    const useCase = makeUseCase({ legalCasesRepository, clientsRepository })

    await useCase.execute({
      collaboratorProfile: CollaboratorProfile.Admin,
      query: { page: 1, pageSize: 50 },
    })

    expect(clientsRepository.findIdsByName).not.toHaveBeenCalled()
    expect(legalCasesRepository.listOperationalRecords).toHaveBeenCalledWith({
      matchingClientIds: [],
      page: 1,
      pageSize: 50,
      search: undefined,
    })
  })

  it('keeps code/title matching when no Client names match', async () => {
    const clientsRepository = makeClientsRepository({ matchingClientIds: [] })
    const legalCasesRepository = makeLegalCasesRepository()
    const useCase = makeUseCase({ legalCasesRepository, clientsRepository })

    await useCase.execute({
      collaboratorProfile: CollaboratorProfile.Admin,
      query: { search: 'CASO-X', page: 1, pageSize: 50 },
    })

    expect(legalCasesRepository.listOperationalRecords).toHaveBeenCalledWith({
      matchingClientIds: [],
      page: 1,
      pageSize: 50,
      search: 'CASO-X',
    })
  })

  it('uses a legal client name and omits unavailable manager profiles', async () => {
    const legalCasesRepository = makeLegalCasesRepository()
    const clientsRepository = makeClientsRepository()
    clientsRepository.findByIds.mockResolvedValue([
      {
        id: 'client-1',
        type: 'legal',
        legalName: 'Empresa HMS Ltda.',
        tradeName: '',
      },
    ] as never)
    const collaboratorsProvider = mock<CaseCollaboratorsProvider>()
    collaboratorsProvider.findByIds.mockResolvedValue([])
    const useCase = makeUseCase({
      legalCasesRepository,
      clientsRepository,
      collaboratorsProvider,
    })

    await expect(
      useCase.execute({
        collaboratorProfile: CollaboratorProfile.Admin,
        query: { page: 1, pageSize: 50 },
      }),
    ).resolves.toMatchObject({
      items: [
        {
          clientName: 'Empresa HMS Ltda.',
          managerNames: [],
        },
      ],
    })
  })

  it('loads deduplicated metadata in four batches for a 50-Case page while preserving ordering', async () => {
    const cases = makeLegalCasesRepository()
    const base = (
      await cases.listOperationalRecords({ matchingClientIds: [], page: 2, pageSize: 50 })
    ).items[0]
    const records: LegalCaseOperationalRecord[] = Array.from(
      { length: 50 },
      (_, index) => ({
        ...base,
        id: `case-${50 - index}`,
        managerCollaboratorIds:
          index % 2 ? ['manager-2', 'manager-1'] : ['manager-1', 'manager-2'],
      }),
    )
    cases.listOperationalRecords.mockClear()
    cases.listOperationalRecords.mockResolvedValue(
      new PaginationResponse(records, 2, 50, 101, 3),
    )
    const clients = makeClientsRepository()
    const areas = makeLegalAreasRepository()
    const topics = makeLegalTopicsRepository()
    const managers = makeCollaboratorsProvider()
    managers.findByIds.mockResolvedValue([
      {
        collaboratorId: 'manager-2',
        professionalName: 'Second Manager',
        email: 'second@hms.test',
        profile: 'lawyer',
        status: 'active',
      },
      {
        collaboratorId: 'manager-1',
        professionalName: 'Manager name',
        email: 'manager@hms.test',
        profile: 'lawyer',
        status: 'active',
      },
    ])
    const result = await makeUseCase({
      legalCasesRepository: cases,
      clientsRepository: clients,
      legalAreasRepository: areas,
      legalTopicsRepository: topics,
      collaboratorsProvider: managers,
    }).execute({
      collaboratorProfile: CollaboratorProfile.Admin,
      query: { page: 2, pageSize: 50 },
    })
    expect(cases.listOperationalRecords).toHaveBeenCalledOnce()
    expect(clients.findByIds).toHaveBeenCalledExactlyOnceWith(['client-1'])
    expect(areas.findByIds).toHaveBeenCalledExactlyOnceWith(['area-1'])
    expect(topics.findByIds).toHaveBeenCalledExactlyOnceWith(['topic-1'])
    expect(managers.findByIds).toHaveBeenCalledExactlyOnceWith(['manager-1', 'manager-2'])
    for (const dependency of [clients, areas, topics, managers])
      expect(dependency.findById).not.toHaveBeenCalled()
    expect(result.items.map(({ id }) => id)).toEqual(records.map(({ id }) => id))
    expect(result.items[0].managerNames).toEqual(['Manager name', 'Second Manager'])
    expect(result.items[1].managerNames).toEqual(['Second Manager', 'Manager name'])
    expect(result).toMatchObject({ page: 2, pageSize: 50, total: 101, totalPages: 3 })
  })

  it('does not load metadata for an empty page', async () => {
    const cases = makeLegalCasesRepository()
    cases.listOperationalRecords.mockResolvedValue(
      new PaginationResponse([], 2, 50, 0, 0),
    )
    const clients = makeClientsRepository()
    const areas = makeLegalAreasRepository()
    const topics = makeLegalTopicsRepository()
    const managers = makeCollaboratorsProvider()
    const result = await makeUseCase({
      legalCasesRepository: cases,
      clientsRepository: clients,
      legalAreasRepository: areas,
      legalTopicsRepository: topics,
      collaboratorsProvider: managers,
    }).execute({
      collaboratorProfile: CollaboratorProfile.Admin,
      query: { page: 2, pageSize: 50 },
    })
    expect(result.items).toEqual([])
    for (const dependency of [clients, areas, topics, managers])
      expect(dependency.findByIds).not.toHaveBeenCalled()
  })

  it('fails when required operational metadata is missing', async () => {
    const legalCasesRepository = makeLegalCasesRepository()
    const useCase = makeUseCase({
      legalCasesRepository,
      legalAreasRepository: makeLegalAreasRepository([]),
    })

    await expect(
      useCase.execute({
        collaboratorProfile: CollaboratorProfile.Admin,
        query: { page: 1, pageSize: 50 },
      }),
    ).rejects.toThrow('Os metadados operacionais do Caso não foram encontrados.')
  })
})

function makeUseCase(options?: {
  legalCasesRepository?: LegalCasesRepository
  clientsRepository?: ClientsRepository
  legalAreasRepository?: LegalAreasRepository
  legalTopicsRepository?: LegalTopicsRepository
  collaboratorsProvider?: CaseCollaboratorsProvider
}) {
  return new ListAllLegalCasesForAdminUseCase(
    options?.legalCasesRepository ?? makeLegalCasesRepository(),
    options?.clientsRepository ?? makeClientsRepository(),
    options?.legalAreasRepository ?? makeLegalAreasRepository(),
    options?.legalTopicsRepository ?? makeLegalTopicsRepository(),
    options?.collaboratorsProvider ?? makeCollaboratorsProvider(),
  )
}

function makeLegalCasesRepository() {
  const repository = mock<LegalCasesRepository>()
  repository.listOperationalRecords.mockResolvedValue(
    new PaginationResponse(
      [
        {
          id: 'case-1',
          publicCode: 'CASO-1',
          title: 'Case title',
          status: 'documentation',
          clientId: 'client-1',
          legalAreaId: 'area-1',
          legalTopicId: 'topic-1',
          updatedAt: new Date('2026-10-01T00:00:00.000Z'),
          managerCollaboratorIds: ['manager-1'],
        },
      ],
      2,
      50,
      51,
      2,
    ),
  )
  return repository
}

function makeClientsRepository(options?: { matchingClientIds?: readonly string[] }) {
  const repository = mock<ClientsRepository>()
  repository.findIdsByName.mockResolvedValue(options?.matchingClientIds ?? ['client-1'])
  repository.findByIds.mockResolvedValue([
    ClientFaker.fake({ id: 'client-1', type: 'natural', name: 'Client name' }),
  ])
  return repository
}

function makeLegalAreasRepository(
  areas = [LegalAreaFaker.fake({ id: 'area-1', name: 'Civil' })],
) {
  const repository = mock<LegalAreasRepository>()
  repository.findByIds.mockResolvedValue(areas)
  return repository
}

function makeLegalTopicsRepository() {
  const repository = mock<LegalTopicsRepository>()
  repository.findByIds.mockResolvedValue([
    LegalTopicFaker.fake({ id: 'topic-1', name: 'Contracts' }),
  ])
  return repository
}

function makeCollaboratorsProvider() {
  const provider = mock<CaseCollaboratorsProvider>()
  provider.findByIds.mockResolvedValue([
    {
      collaboratorId: 'manager-1',
      professionalName: 'Manager name',
      email: 'manager@hms.test',
      profile: 'lawyer',
      status: 'active',
    },
  ])
  return provider
}
