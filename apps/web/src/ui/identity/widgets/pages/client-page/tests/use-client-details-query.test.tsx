import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useClientDetailsQuery } from '../use-client-details-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('useClientDetailsQuery', () => {
  const identityService = {
    getClient: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({ identityService } as never)
  })

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return function QueryProvider({ children }: PropsWithChildren) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
  }

  it('loads client details through the identity service when clientId is provided', async () => {
    const clientDetails = { client: { id: 'client-1', name: 'John Doe' }, consents: [] }
    identityService.getClient.mockResolvedValue(new RestResponse({ body: clientDetails }))

    const { result } = renderHook(() => useClientDetailsQuery('client-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.clientDetails).toEqual(clientDetails))
    expect(identityService.getClient).toHaveBeenCalledWith('client-1')
  })

  it('does not execute query when clientId is not provided', () => {
    renderHook(() => useClientDetailsQuery(undefined), {
      wrapper: createWrapper(),
    })

    expect(identityService.getClient).not.toHaveBeenCalled()
  })

  it('exposes failures as query errors', async () => {
    identityService.getClient.mockResolvedValue(
      new RestResponse({ statusCode: 500, errorMessage: 'Internal error' }),
    )

    const { result } = renderHook(() => useClientDetailsQuery('client-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.clientDetailsError).toBeInstanceOf(Error))
  })
})
