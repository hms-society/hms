import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createQueryHookTestWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, wrapper }
}

const mocks = vi.hoisted(() => ({
  caseManagementService: { getCaseOpeningSource: vi.fn() },
  intakeService: { getIntake: vi.fn().mockResolvedValue({ isFailure: false, body: {} }) },
  currentCollaborator: { collaboratorId: 'collaborator-1' } as {
    collaboratorId: string
  } | null,
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    caseManagementService: mocks.caseManagementService,
    intakeService: mocks.intakeService,
  }),
}))
vi.mock('@/ui/identity/hooks/use-current-collaborator-query', () => ({
  useCurrentCollaboratorQuery: () => ({ currentCollaborator: mocks.currentCollaborator }),
}))

vi.mock('@/ui/intake/hooks/use-intakes-list-query', () => ({
  useIntakesListQuery: () => ({ data: { items: [] } }),
}))
vi.mock(
  '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query',
  () => ({ useLegalAreasQuery: () => ({ legalAreas: [] }) }),
)
vi.mock(
  '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query',
  () => ({ useLegalTopicsQuery: () => ({ legalTopics: [] }) }),
)
import { useCreateCaseLookups } from '../use-create-case-lookups'
const form = { watch: () => 'intake-1', setValue: vi.fn() }
function useOpeningLookups() {
  return useCreateCaseLookups(form as never, null, vi.fn(), '')
}

describe('useCreateCaseLookups source authorization', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.currentCollaborator = { collaboratorId: 'collaborator-1' }
  })

  it('loads the source for the intake and active collaborator', async () => {
    const source = { intakeId: 'intake-1', caseId: 'case-1' }
    mocks.caseManagementService.getCaseOpeningSource.mockResolvedValue({
      isFailure: false,
      body: source,
    })
    const { wrapper } = createQueryHookTestWrapper()

    const { result } = renderHook(() => useOpeningLookups(), {
      wrapper,
    })

    await waitFor(() => expect(result.current.caseOpeningSource).toEqual(source))
    expect(mocks.caseManagementService.getCaseOpeningSource).toHaveBeenCalledWith(
      'intake-1',
    )
  })

  it('does not fetch without an intake or current collaborator', async () => {
    mocks.currentCollaborator = null
    const { wrapper } = createQueryHookTestWrapper()

    const { result } = renderHook(() => useOpeningLookups(), {
      wrapper,
    })

    expect(result.current.caseOpeningSource).toBeNull()
    expect(mocks.caseManagementService.getCaseOpeningSource).not.toHaveBeenCalled()
  })

  it('clears protected source data and preserves the forbidden error without refetching', async () => {
    const failure = new Error('Forbidden')
    const { queryClient, wrapper } = createQueryHookTestWrapper()
    const setQueryData = vi.spyOn(queryClient, 'setQueryData')
    const throwError = vi.fn(() => {
      throw failure
    })
    mocks.caseManagementService.getCaseOpeningSource.mockResolvedValue({
      isFailure: true,
      statusCode: 403,
      throwError,
    })

    renderHook(() => useOpeningLookups(), {
      wrapper,
    })

    await waitFor(() => expect(throwError).toHaveBeenCalledOnce())
    expect(setQueryData).toHaveBeenCalledWith(
      ['case-management', 'opening-source', 'intake-1', 'collaborator-1'],
      null,
    )
  })

  it('surfaces non-forbidden failures without removing the cache', async () => {
    const failure = new Error('Unavailable')
    const { queryClient, wrapper } = createQueryHookTestWrapper()
    const setQueryData = vi.spyOn(queryClient, 'setQueryData')
    mocks.caseManagementService.getCaseOpeningSource.mockResolvedValue({
      isFailure: true,
      statusCode: 503,
      throwError: () => {
        throw failure
      },
    })

    const { result } = renderHook(() => useOpeningLookups(), {
      wrapper,
    })

    await waitFor(() => expect(result.current.caseOpeningSourceError).toBe(failure))
    expect(setQueryData).not.toHaveBeenCalled()
  })
})
