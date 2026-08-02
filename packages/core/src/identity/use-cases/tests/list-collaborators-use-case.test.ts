import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { CollaboratorSummaryFaker } from '../../domain/entities/fakers'
import { AuthUserFaker } from '../../domain/structures/fakers'
import type { CollaboratorsRepository } from '../../interfaces'
import type { CollaboratorSummary } from '../../domain/entities'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { AuthorizeAdminUseCase } from '../authorize-admin-use-case'
import { ListCollaboratorsUseCase } from '../list-collaborators-use-case'

describe('List Collaborators Use Case', () => {
  const createPage = (
    overrides: Partial<PaginationResponse<CollaboratorSummary>> = {},
  ): PaginationResponse<CollaboratorSummary> => ({
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    ...overrides,
  })

  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let authorizeAdminUseCase: MockProxy<AuthorizeAdminUseCase>

  beforeEach(() => {
    collaboratorsRepository = mock<CollaboratorsRepository>()
    authorizeAdminUseCase = mock<AuthorizeAdminUseCase>()
    authorizeAdminUseCase.execute.mockResolvedValue()
  })

  it('authorizes the request and delegates normalized AND/OR filters', async () => {
    const authUser = AuthUserFaker.fake()
    const page = createPage({
      items: [CollaboratorSummaryFaker.legal()],
      page: 2,
      pageSize: 100,
      total: 101,
      totalPages: 2,
    })
    collaboratorsRepository.list.mockResolvedValue(page)
    const useCase = new ListCollaboratorsUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
    )

    await expect(
      useCase.execute({
        authUser,
        query: {
          search: '  Ana Silva  ',
          profile: 'lawyer',
          jobTitle: '  Advogado  ',
          status: 'active',
          page: 2,
          pageSize: 100,
        },
      }),
    ).resolves.toBe(page)

    expect(authorizeAdminUseCase.execute).toHaveBeenCalledWith({ authUser })
    expect(collaboratorsRepository.list).toHaveBeenCalledWith({
      search: 'Ana Silva',
      profile: 'lawyer',
      jobTitle: 'Advogado',
      status: 'active',
      excludeUserId: authUser.id,
      page: 2,
      pageSize: 100,
    })
  })

  it('applies defaults and keeps page-size within the contract limit', async () => {
    const page = createPage({
      items: [],
      page: 4,
      pageSize: 100,
      total: 301,
      totalPages: 4,
    })
    collaboratorsRepository.list.mockResolvedValue(page)
    const useCase = new ListCollaboratorsUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
    )

    await expect(
      useCase.execute({
        authUser: AuthUserFaker.fake(),
        query: {
          search: '   ',
          jobTitle: '  ',
          page: 4.8,
          pageSize: 101,
        },
      }),
    ).resolves.toBe(page)

    expect(collaboratorsRepository.list).toHaveBeenCalledWith({
      excludeUserId: expect.any(String),
      page: 4,
      pageSize: 100,
    })
  })

  it('uses page one and twenty items by default', async () => {
    const page = createPage()
    collaboratorsRepository.list.mockResolvedValue(page)
    const useCase = new ListCollaboratorsUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
    )

    await useCase.execute({ authUser: AuthUserFaker.fake() })

    expect(collaboratorsRepository.list).toHaveBeenCalledWith({
      excludeUserId: expect.any(String),
      page: 1,
      pageSize: 20,
    })
  })

  it('returns an empty page with real metadata and does not resolve rows itself', async () => {
    const page = createPage({
      items: [],
      page: 9,
      pageSize: 20,
      total: 3,
      totalPages: 1,
    })
    collaboratorsRepository.list.mockResolvedValue(page)
    const useCase = new ListCollaboratorsUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
    )

    await expect(
      useCase.execute({
        authUser: AuthUserFaker.fake(),
        query: { page: 9, pageSize: 20 },
      }),
    ).resolves.toEqual(page)
    expect(collaboratorsRepository.list).toHaveBeenCalledTimes(1)
  })

  it('does not list collaborators when administrative authorization fails', async () => {
    authorizeAdminUseCase.execute.mockRejectedValue(new Error('forbidden'))
    const useCase = new ListCollaboratorsUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
    )

    await expect(useCase.execute({ authUser: AuthUserFaker.fake() })).rejects.toThrow(
      'forbidden',
    )
    expect(collaboratorsRepository.list).not.toHaveBeenCalled()
  })
})
