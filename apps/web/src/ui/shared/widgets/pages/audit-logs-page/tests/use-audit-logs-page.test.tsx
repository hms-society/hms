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
    export: vi.fn(),
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

  it('sends the complete action search term to the backend', async () => {
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
    act(() => result.current.handleActionChange('permission'))

    await waitFor(() =>
      expect(result.current.auditLogs.map((event) => event.id)).toEqual([
        'event-third-party',
      ]),
    )
    await waitFor(() =>
      expect(auditLogsService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ action: 'permission' }),
      ),
    )
  })

  it('downloads an individual event as CSV', async () => {
    auditLogsService.list.mockResolvedValue({
      isFailure: false,
      body: { data: [], total: 0, page: 1, limit: 20 },
    })
    const createObjectURL = vi.fn().mockReturnValue('blob:csv')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    const { result } = renderHook(() => useAuditLogsPage(), { wrapper })
    const click = vi.fn()
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement)
    const event = {
      id: 'event-1',
      occurredAt: new Date('2026-10-07T12:00:00.000Z'),
      entityType: 'third_party' as const,
      action: 'created',
      status: 'success' as const,
    }

    await waitFor(() => expect(result.current.isLoadingAuditLogs).toBe(false))
    act(() => result.current.handleEventExport('csv', event))

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(createElement).toHaveBeenCalledWith('a')
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv')
    expect((createElement.mock.results[0]?.value as HTMLAnchorElement).download).toBe(
      'audit-log-event-1.csv',
    )
  })
})
