import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestContext } from '@/ui/shared/contexts/rest-context'
import { useAuditLogsPage } from '../use-audit-logs-page'

describe('useAuditLogsPage', () => {
  let queryClient: QueryClient
  const auditLogsService = {
    list: vi.fn(),
    getDetails: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <RestContext.Provider value={{ auditLogsService } as never}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </RestContext.Provider>
    )
  }

  it('filters the loaded events using translated entity and action labels', async () => {
    auditLogsService.list.mockResolvedValue({
      isFailure: false,
      body: {
        data: [
          {
            id: 'event-third-party',
            occurredAt: new Date(),
            entityType: 'third_party',
            action: 'permission_granted',
          },
          {
            id: 'event-document',
            occurredAt: new Date(),
            entityType: 'document_validation',
            action: 'decision_recorded',
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      },
    })

    const { result } = renderHook(() => useAuditLogsPage(), { wrapper })

    await waitFor(() => expect(result.current.auditLogs).toHaveLength(2))
    act(() => result.current.handleActionChange('permissão'))

    expect(result.current.auditLogs.map((event) => event.id)).toEqual([
      'event-third-party',
    ])
  })
})
