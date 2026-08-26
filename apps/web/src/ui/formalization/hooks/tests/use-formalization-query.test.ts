import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useFormalizationQuery } from '../use-formalization-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

function createWrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient, children })
  }
}

describe('useFormalizationQuery', () => {
  const getFormalizationMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({
      formalizationService: { get: getFormalizationMock },
    } as never)
  })

  it('resolves a forbidden response to an error without retrying', async () => {
    getFormalizationMock.mockResolvedValue(
      new RestResponse({
        statusCode: HTTP_STATUS_CODE.forbidden,
        errorMessage: 'Forbidden',
      }),
    )
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: true, retryDelay: 0 },
      },
    })

    const { result } = renderHook(() => useFormalizationQuery('formalization-id'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(getFormalizationMock).toHaveBeenCalledTimes(1)
    expect(result.current.data).toBeUndefined()
  })
})
