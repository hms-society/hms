import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useClientIntakesQuery } from '../use-client-intakes-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('useClientIntakesQuery', () => {
  const intakeService = {
    listClientIntake: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({ intakeService } as never)
  })

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return function QueryProvider({ children }: PropsWithChildren) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
  }

  it('loads client intakes through the intake service when clientId is provided', async () => {
    const clientIntakes = [{ id: 'intake-1', sequenceNumber: 1 }]
    intakeService.listClientIntake.mockResolvedValue(
      new RestResponse({ body: clientIntakes }),
    )

    const { result } = renderHook(() => useClientIntakesQuery('client-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.clientIntakes).toEqual(clientIntakes))
    expect(intakeService.listClientIntake).toHaveBeenCalledWith('client-1')
  })

  it('does not execute listClientIntake when clientId is not provided', async () => {
    const { result } = renderHook(() => useClientIntakesQuery(undefined), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.clientIntakes).toEqual([]))
    expect(intakeService.listClientIntake).not.toHaveBeenCalled()
  })

  it('exposes failures as query errors', async () => {
    intakeService.listClientIntake.mockResolvedValue(
      new RestResponse({ statusCode: 500, errorMessage: 'Internal error' }),
    )

    const { result } = renderHook(() => useClientIntakesQuery('client-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.clientIntakesError).toBeInstanceOf(Error))
  })
})
