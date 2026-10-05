import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePortalDocumentsPage } from '../use-portal-documents-page'
import { RestContext } from '@/ui/shared/contexts/rest-context'

describe('usePortalDocumentsPage', () => {
  let queryClient: QueryClient
  const mockCaseManagementService = {
    listPortalPendingChecklist: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <RestContext.Provider
        value={
          {
            caseManagementService: mockCaseManagementService as any,
          } as any
        }
      >
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </RestContext.Provider>
    )
  }

  it('classifies checklist items into pending, inAnalysis and validated', async () => {
    const items = [
      { id: '1', title: 'Doc 1', status: 'pending' },
      { id: '2', title: 'Doc 2', status: 'in_analysis' },
      { id: '3', title: 'Doc 3', status: 'validated' },
    ]

    mockCaseManagementService.listPortalPendingChecklist.mockResolvedValue({
      isFailure: false,
      body: items,
    })

    const { result } = renderHook(() => usePortalDocumentsPage('case-1', 'token-1'), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.checklist).toHaveLength(3)
    expect(result.current.pendingItems).toHaveLength(1)
    expect(result.current.pendingItems[0].id).toBe('1')
    expect(result.current.inAnalysisItems).toHaveLength(1)
    expect(result.current.inAnalysisItems[0].id).toBe('2')
    expect(result.current.validatedItems).toHaveLength(1)
    expect(result.current.validatedItems[0].id).toBe('3')
  })

  it('handles empty parameters gracefully without executing query', () => {
    const { result } = renderHook(() => usePortalDocumentsPage('', ''), { wrapper })

    expect(result.current.checklist).toEqual([])
    expect(mockCaseManagementService.listPortalPendingChecklist).not.toHaveBeenCalled()
  })
})
