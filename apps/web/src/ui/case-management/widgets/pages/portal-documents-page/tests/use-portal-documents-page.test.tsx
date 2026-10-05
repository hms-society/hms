import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestContext } from '@/ui/shared/contexts/rest-context'
import { usePortalDocumentsPage } from '../use-portal-documents-page'

describe('usePortalDocumentsPage', () => {
  let queryClient: QueryClient
  const mockCaseManagementService = {
    getThirdPartyPortalCase: vi.fn(),
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
        value={{ caseManagementService: mockCaseManagementService } as never}
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

    mockCaseManagementService.getThirdPartyPortalCase.mockResolvedValue({
      isFailure: false,
      body: { canUpload: true },
    })
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

  it('handles empty parameters gracefully without executing queries', () => {
    const { result } = renderHook(() => usePortalDocumentsPage('', ''), { wrapper })

    expect(result.current.checklist).toEqual([])
    expect(mockCaseManagementService.getThirdPartyPortalCase).not.toHaveBeenCalled()
    expect(mockCaseManagementService.listPortalPendingChecklist).not.toHaveBeenCalled()
  })
})
