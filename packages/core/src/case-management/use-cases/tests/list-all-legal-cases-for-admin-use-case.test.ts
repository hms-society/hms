import { describe, expect, it, vi } from 'vitest'
import { CollaboratorProfile } from '#identity/domain/structures'
import type { ClientsRepository } from '#identity/interfaces/clients-repository'
import type { CaseCollaboratorsProvider, LegalCasesRepository } from '../../interfaces'
import type { LegalAreasRepository } from '#legal-catalog/interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '#legal-catalog/interfaces/legal-topics-repository'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { PaginationResponse } from '#shared/responses/pagination-response'

import { ListAllLegalCasesForAdminUseCase } from '../list-all-legal-cases-for-admin-use-case'

describe('ListAllLegalCasesForAdminUseCase', () => {
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
    vi.mocked(clientsRepository.findById).mockResolvedValue({
      type: 'legal',
      legalName: 'Empresa HMS Ltda.',
      tradeName: '',
    } as never)
    const collaboratorsProvider = {
      findById: vi.fn().mockResolvedValue(undefined),
    } as unknown as CaseCollaboratorsProvider
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

  it('fails when required operational metadata is missing', async () => {
    const legalCasesRepository = makeLegalCasesRepository()
    const useCase = makeUseCase({
      legalCasesRepository,
      legalAreasRepository: {
        findById: vi.fn().mockResolvedValue(undefined),
      } as unknown as LegalAreasRepository,
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
  collaboratorsProvider?: CaseCollaboratorsProvider
}) {
  return new ListAllLegalCasesForAdminUseCase(
    options?.legalCasesRepository ?? makeLegalCasesRepository(),
    options?.clientsRepository ?? makeClientsRepository(),
    options?.legalAreasRepository ??
      ({
        findById: vi.fn().mockResolvedValue({ id: 'area-1', name: 'Civil' }),
      } as unknown as LegalAreasRepository),
    {
      findById: vi.fn().mockResolvedValue({ id: 'topic-1', name: 'Contracts' }),
    } as unknown as LegalTopicsRepository,
    options?.collaboratorsProvider ??
      ({
        findById: vi.fn().mockResolvedValue({ professionalName: 'Manager name' }),
      } as unknown as CaseCollaboratorsProvider),
  )
}

function makeLegalCasesRepository() {
  return {
    listOperationalRecords: vi.fn().mockResolvedValue(
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
    ),
  } as unknown as LegalCasesRepository
}

function makeClientsRepository(options?: { matchingClientIds?: readonly string[] }) {
  return {
    findIdsByName: vi.fn().mockResolvedValue(options?.matchingClientIds ?? ['client-1']),
    findById: vi.fn().mockResolvedValue({ type: 'natural', name: 'Client name' }),
  } as unknown as ClientsRepository
}
