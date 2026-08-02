import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { collaboratorQueryKeys } from '@/ui/identity/hooks/collaborator-query-keys'
import { useCollaboratorLegalAreasQuery } from '@/ui/identity/hooks/use-collaborator-legal-areas-query'
import { useCollaboratorLegalTopicsQuery } from '@/ui/identity/widgets/components/collaborator-expertise-group/use-collaborator-legal-topics-query'
import { useCollaboratorsQuery } from '@/ui/identity/widgets/pages/collaborators-page/use-collaborators-query'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRegisterCollaboratorAction } from '@/ui/identity/widgets/components/collaborator-register-dialog/use-register-collaborator-action'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('Identity collaborator hooks', () => {
  const identityService = {
    getCurrentCollaborator: vi.fn(),
    listCollaborators: vi.fn(),
    registerCollaborator: vi.fn(),
  }
  const legalCatalogService = {
    listLegalAreas: vi.fn(),
    listLegalTopics: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({ identityService, legalCatalogService } as never)
  })

  function createWrapper(
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
  ) {
    return {
      queryClient,
      wrapper: function QueryProvider({ children }: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      },
    }
  }

  it('loads the current collaborator through the semantic query', async () => {
    const currentCollaborator = { collaboratorId: 'collaborator-id' }
    identityService.getCurrentCollaborator.mockResolvedValue(
      new RestResponse({ body: currentCollaborator }),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCurrentCollaboratorQuery(), { wrapper })

    await waitFor(() =>
      expect(result.current.currentCollaborator).toEqual(currentCollaborator),
    )
    expect(identityService.getCurrentCollaborator).toHaveBeenCalledOnce()
  })

  it('includes search, filters, and pagination in the collaborators query key', async () => {
    const query = {
      search: 'Ana',
      profile: CollaboratorProfile.Lawyer,
      jobTitle: 'Sócia',
      status: UserStatus.Active,
      page: 2,
      pageSize: 10,
    } as const
    const collaboratorsPage = {
      items: [],
      page: 2,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    }
    identityService.listCollaborators.mockResolvedValue(
      new RestResponse({ body: collaboratorsPage }),
    )

    const { queryClient, wrapper } = createWrapper()
    const { result } = renderHook(() => useCollaboratorsQuery(query), { wrapper })

    await waitFor(() =>
      expect(result.current.collaboratorsPage).toEqual(collaboratorsPage),
    )
    expect(identityService.listCollaborators).toHaveBeenCalledWith(query)
    expect(queryClient.getQueryState(collaboratorQueryKeys.list(query))).toBeDefined()
  })

  it('exposes REST failures from the current collaborator query', async () => {
    identityService.getCurrentCollaborator.mockResolvedValue(
      new RestResponse({ statusCode: 500, errorMessage: 'temporary failure' }),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCurrentCollaboratorQuery(), { wrapper })

    await waitFor(() =>
      expect(result.current.currentCollaboratorError).toBeInstanceOf(Error),
    )
  })

  it('loads legal areas and only loads topics after an area is selected', async () => {
    const areas = [{ id: 'area-id', name: 'Cível' }]
    const topics = [{ id: 'topic-id', legalAreaId: 'area-id', name: 'Contratos' }]
    legalCatalogService.listLegalAreas.mockResolvedValue(
      new RestResponse({ body: areas }),
    )
    legalCatalogService.listLegalTopics.mockResolvedValue(
      new RestResponse({ body: topics }),
    )

    const { wrapper } = createWrapper()
    const areasResult = renderHook(() => useCollaboratorLegalAreasQuery(), {
      wrapper,
    }).result
    const disabledTopicsResult = renderHook(
      () => useCollaboratorLegalTopicsQuery(undefined),
      { wrapper },
    ).result

    await waitFor(() => expect(areasResult.current.legalAreas).toEqual(areas))
    expect(disabledTopicsResult.current.legalTopics).toEqual([])
    expect(legalCatalogService.listLegalTopics).not.toHaveBeenCalled()

    const { result: topicsResult } = renderHook(
      () => useCollaboratorLegalTopicsQuery('area-id'),
      { wrapper },
    )
    await waitFor(() => expect(topicsResult.current.legalTopics).toEqual(topics))
    expect(legalCatalogService.listLegalTopics).toHaveBeenCalledWith('area-id')
  })

  it('invalidates collaborator lists after a successful registration', async () => {
    const query = { search: 'Ana', page: 1, pageSize: 10 } as const
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    queryClient.setQueryData(collaboratorQueryKeys.list(query), { items: [] })
    identityService.registerCollaborator.mockResolvedValue(
      new RestResponse({ body: { collaboratorId: 'new-collaborator-id' } }),
    )

    const { wrapper } = createWrapper(queryClient)
    const { result } = renderHook(() => useRegisterCollaboratorAction(), { wrapper })
    const draft = {
      email: 'new@example.com',
      professionalName: 'New Collaborator',
      profile: CollaboratorProfile.Admin,
    } as const

    await result.current.registerCollaborator(draft)

    expect(
      queryClient.getQueryState(collaboratorQueryKeys.list(query))?.isInvalidated,
    ).toBe(true)
    expect(identityService.registerCollaborator).toHaveBeenCalledWith(draft)
  })

  it('keeps the registration draft available when the request fails', async () => {
    identityService.registerCollaborator.mockResolvedValue(
      new RestResponse({ statusCode: 409, errorMessage: 'email already exists' }),
    )

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useRegisterCollaboratorAction(), { wrapper })
    const draft = {
      email: 'existing@example.com',
      professionalName: 'Existing Collaborator',
      profile: CollaboratorProfile.Attendant,
    } as const

    await expect(result.current.registerCollaborator(draft)).rejects.toThrow(
      'email already exists',
    )
    await waitFor(() =>
      expect(result.current.registerCollaboratorError).toBeInstanceOf(Error),
    )
    expect(identityService.registerCollaborator).toHaveBeenCalledWith(draft)
  })
})
