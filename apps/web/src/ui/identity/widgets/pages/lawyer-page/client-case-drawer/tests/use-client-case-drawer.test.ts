import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useClientCaseDrawer } from '../use-client-case-drawer'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

vi.mock('@/ui/shared/hooks/use-rest-context')
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQuery: vi.fn(({ queryKey, queryFn: _queryFn, enabled }) => {
      if (enabled === false) {
        return { data: undefined, isLoading: false, isError: false }
      }
      if (queryKey[0] === 'case-management' && queryKey[1] === 'my-cases') {
        return {
          data: [
            {
              id: 'case-1',
              publicCode: 'CASO-20260916-0001',
              title: 'Aposentadoria Antônio',
              clientName: 'Antônio Carvalho',
              legalArea: 'Previdenciário',
              status: 'documentation',
              team: [{ collaboratorId: 'col-1', name: 'Dr. Silva' }],
            },
            {
              id: 'case-2',
              publicCode: 'CASO-20260916-0002',
              title: 'Revisão Antônio',
              clientName: 'Antônio Carvalho',
              legalArea: 'Previdenciário',
              status: 'documentation',
              team: [],
            },
          ],
          isLoading: false,
          isError: false,
        }
      }
      if (queryKey[0] === 'case-details') {
        return {
          data: {
            id: 'case-1',
            publicCode: 'CASO-20260916-0001',
            title: 'Aposentadoria Antônio',
            clientName: 'Antônio Carvalho',
            legalArea: 'Previdenciário',
            status: 'documentation',
            team: [{ collaboratorId: 'col-1', name: 'Dr. Silva' }],
          },
          isLoading: false,
        }
      }
      if (queryKey[0] === 'case-checklist') {
        return {
          data: [
            { id: 'item-1', status: 'validated' },
            { id: 'item-2', status: 'pending' },
          ],
          isLoading: false,
        }
      }
      return { data: undefined, isLoading: false }
    }),
  }
})

describe('useClientCaseDrawer', () => {
  const mockCaseManagementService = {
    listMyCases: vi.fn(),
    getLegalCaseDetails: vi.fn(),
    listCaseChecklist: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRestContext).mockReturnValue({
      caseManagementService: mockCaseManagementService,
    } as any)
  })

  it('filters cases by clientName and calculates checklist metrics', () => {
    const { result } = renderHook(() =>
      useClientCaseDrawer({
        clientName: 'Antônio Carvalho',
        open: true,
      }),
    )

    expect(result.current.clientCases.length).toBe(2)
    expect(result.current.activeCase?.id).toBe('case-1')
    expect(result.current.totalChecklistItems).toBe(2)
    expect(result.current.validatedItemsCount).toBe(1)
    expect(result.current.pendingItemsCount).toBe(1)
    expect(result.current.completionPercentage).toBe(50)
  })

  it('returns empty array when clientName has no matching cases', () => {
    const { result } = renderHook(() =>
      useClientCaseDrawer({
        clientName: 'Cliente Inexistente',
        open: true,
      }),
    )

    expect(result.current.clientCases.length).toBe(0)
  })
})
