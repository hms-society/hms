import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useFormalizationQuery } from '../use-formalization-query'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }))

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('useFormalizationQuery', () => {
  const getFormalizationMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({
      formalizationService: { get: getFormalizationMock },
    } as never)
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isFetching: false,
      isLoading: false,
    })
  })

  it('resolves a forbidden response to an error without retrying', async () => {
    getFormalizationMock.mockResolvedValue(
      new RestResponse({
        statusCode: HTTP_STATUS_CODE.forbidden,
        errorMessage: 'Forbidden',
      }),
    )
    renderHook(() => useFormalizationQuery('formalization-id'))
    const queryOptions = useQueryMock.mock.calls[0]?.[0]

    await expect(queryOptions.queryFn()).rejects.toMatchObject({
      statusCode: HTTP_STATUS_CODE.forbidden,
    })
    expect(queryOptions.retry).toBe(false)
    expect(getFormalizationMock).toHaveBeenCalledTimes(1)
  })
})
