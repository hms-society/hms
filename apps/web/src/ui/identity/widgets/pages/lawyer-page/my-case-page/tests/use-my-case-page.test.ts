import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { CollaboratorProfile, UserStatus } from '@hms/core/identity/domain/structures'
import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useMyCasePage } from '../use-my-case-page'

vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: vi.fn(),
}))
vi.mock('@/ui/case-management/hooks/use-case-team-query', () => ({
  useCaseTeamQuery: vi.fn(() => ({
    caseTeam: null,
    caseTeamError: null,
    isLoadingCaseTeam: false,
  })),
}))
vi.mock('../hooks/use-case-checklist', () => ({
  useCaseChecklist: vi.fn(() => ({
    checklistItems: [],
    completionPercentage: 0,
    mandatoryItemsCount: 0,
    pendingItemsCount: 0,
    validatedItemsCount: 0,
  })),
}))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const current = vi.mocked(useCurrentCollaboratorQuery)
const rest = vi.mocked(useRestContext)

describe('useMyCasePage', () => {
  beforeEach(() => {
    current.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'admin-1',
        profile: CollaboratorProfile.Admin,
        status: UserStatus.Active,
      },
    } as never)
    rest.mockReturnValue({
      caseManagementService: {
        getLegalCaseDetails: vi.fn().mockResolvedValue({
          isFailure: false,
          body: {
            id: 'case-1',
            title: 'Readable Admin case',
          },
        }),
        listMyCases: vi.fn(),
        listCasePortalAccess: vi.fn(),
      },
      identityService: { listThirdParties: vi.fn() },
    } as never)
  })

  it('loads case read content for an active Admin without membership-only queries or portal management data', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client }, children)
    const { result } = renderHook(
      () => useMyCasePage({ caseId: 'case-1', isAdministrator: true }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.caseTitle).toBe('Readable Admin case'))
    expect(result.current.canLoadLegalContent).toBe(true)
    expect(result.current.activeTab).toBe('visao-geral')
    const services = rest.mock.results.at(-1)?.value
    expect(services.caseManagementService.getLegalCaseDetails).toHaveBeenCalledWith(
      'case-1',
    )
    expect(services.caseManagementService.listMyCases).not.toHaveBeenCalled()
    expect(services.caseManagementService.listCasePortalAccess).not.toHaveBeenCalled()
    expect(services.identityService.listThirdParties).not.toHaveBeenCalled()
    client.clear()
  })

  it('fills missing detail presentation fields from the legal collaborator case list', async () => {
    current.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'lawyer-1',
        profile: CollaboratorProfile.Lawyer,
        status: UserStatus.Active,
      },
    } as never)
    const getLegalCaseDetails = vi.fn().mockResolvedValue({
      isFailure: false,
      body: { id: 'case-1' },
    })
    const listMyCases = vi.fn().mockResolvedValue({
      isFailure: false,
      body: [
        {
          id: 'case-1',
          title: 'Case title from list',
          legalArea: 'Cível',
          clientName: 'Cliente from list',
        },
      ],
    })
    rest.mockReturnValue({
      caseManagementService: {
        getLegalCaseDetails,
        listMyCases,
        listCasePortalAccess: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
      },
      identityService: {
        listThirdParties: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
      },
    } as never)
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client }, children)

    const { result } = renderHook(() => useMyCasePage({ caseId: 'case-1' }), { wrapper })

    await waitFor(() => expect(result.current.caseTitle).toBe('Case title from list'))
    expect(result.current.caseLegalArea).toBe('Cível')
    expect(result.current.caseClientName).toBe('Cliente from list')
    expect(getLegalCaseDetails).toHaveBeenCalledWith('case-1')
    expect(listMyCases).toHaveBeenCalledOnce()
    client.clear()
  })

  it.each([
    { statusCode: 403, shouldClearCaseDetails: true },
    { statusCode: 500, shouldClearCaseDetails: false },
  ])('clears protected case details only after a $statusCode detail failure', async ({
    statusCode,
    shouldClearCaseDetails,
  }) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const removeQueries = vi
      .spyOn(client, 'removeQueries')
      .mockImplementation(() => undefined)
    const getLegalCaseDetails = vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ statusCode, errorMessage: 'Case unavailable' }),
      )
    rest.mockReturnValue({
      caseManagementService: {
        getLegalCaseDetails,
        listMyCases: vi.fn(),
        listCasePortalAccess: vi.fn(),
      },
      identityService: { listThirdParties: vi.fn() },
    } as never)
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client }, children)

    const { result } = renderHook(
      () => useMyCasePage({ caseId: 'case-1', isAdministrator: true }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.caseError).toBeInstanceOf(Error))

    if (shouldClearCaseDetails) {
      expect(removeQueries).toHaveBeenCalledWith({
        queryKey: ['case-details', 'case-1'],
      })
    } else {
      expect(removeQueries).not.toHaveBeenCalled()
    }
    expect(getLegalCaseDetails).toHaveBeenCalledOnce()
    client.clear()
  })

  it('surfaces a failed legal case list request while retaining the detail presentation', async () => {
    current.mockReturnValue({
      currentCollaborator: {
        collaboratorId: 'lawyer-1',
        profile: CollaboratorProfile.Lawyer,
        status: UserStatus.Active,
      },
    } as never)
    const getLegalCaseDetails = vi.fn().mockResolvedValue(
      new RestResponse({
        body: {
          id: 'case-1',
          title: 'Case title from detail',
          legalArea: 'Cível',
          clientName: 'Cliente from detail',
        },
      }),
    )
    const listMyCases = vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ statusCode: 500, errorMessage: 'List unavailable' }),
      )
    rest.mockReturnValue({
      caseManagementService: {
        getLegalCaseDetails,
        listMyCases,
        listCasePortalAccess: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
      },
      identityService: {
        listThirdParties: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
      },
    } as never)
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client }, children)

    const { result } = renderHook(() => useMyCasePage({ caseId: 'case-1' }), {
      wrapper,
    })

    await waitFor(() => expect(listMyCases).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(
        client.getQueryState(['case-management', 'my-cases', 'lawyer-1'])?.status,
      ).toBe('error'),
    )
    expect(result.current.caseTitle).toBe('Case title from detail')
    expect(result.current.caseLegalArea).toBe('Cível')
    expect(result.current.caseClientName).toBe('Cliente from detail')
    client.clear()
  })
})
