import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  FormalizationSignatureSendingReviewResponse,
  FormalizationSignatureSendingStatusResponse,
} from '@hms/core/formalization/domain/structures'

import {
  getFormalizationSignatureSendingStatusQueryKey,
  useFormalizationSignatureSending,
} from '../use-formalization-signature-sending-action'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const { useMutationMock, useQueryClientMock, useQueryMock } = vi.hoisted(() => ({
  useMutationMock: vi.fn(),
  useQueryClientMock: vi.fn(),
  useQueryMock: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useMutation: useMutationMock,
  useQuery: useQueryMock,
  useQueryClient: useQueryClientMock,
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

const review: FormalizationSignatureSendingReviewResponse = {
  formalizationId: 'formalization-1',
  version: 9,
  status: 'ready_for_sending',
  ready: true,
  documents: [],
  signatories: [],
  messagePreview: 'Solicitação de assinatura da formalização.',
  issues: [],
  currentRequest: {
    id: 'request-1',
    status: 'sending',
    version: 2,
    openDocuments: 2,
    totalDocuments: 2,
  },
}

const status = {
  formalizationId: 'formalization-1',
  formalizationStatus: 'in_progress' as const,
  formalizationVersion: 4,
  requestId: 'request-1',
  status: 'sending',
  version: 2,
  totalDocuments: 2,
  completedDocuments: 0,
  failedDocuments: 0,
  canCancel: true,
  canRetry: false,
} as unknown as FormalizationSignatureSendingStatusResponse

type QueryResult<Body> = {
  readonly data: Body | undefined
  readonly error: Error | null
  readonly isFetching: boolean
  readonly isLoading: boolean
  readonly refetch: ReturnType<typeof vi.fn>
}

type MutationOptions = {
  readonly onSuccess?: (response: {
    readonly cancellationPending: boolean
  }) => void | Promise<void>
}

type RefetchInterval<Body> = (query: {
  readonly state: { readonly data?: Body }
}) => number | false

function getRefetchInterval<Body>(queryCallIndex: number) {
  const options = useQueryMock.mock.calls[queryCallIndex]?.[0] as
    | { readonly refetchInterval?: RefetchInterval<Body> }
    | undefined

  if (typeof options?.refetchInterval !== 'function') {
    throw new Error('Expected a refetch interval callback')
  }

  return options.refetchInterval
}

describe('useFormalizationSignatureSending', () => {
  let reviewData: FormalizationSignatureSendingReviewResponse | undefined
  let statusData: FormalizationSignatureSendingStatusResponse | null | undefined
  const reviewRefetch = vi.fn().mockResolvedValue(undefined)
  const statusRefetch = vi.fn().mockResolvedValue(undefined)
  const queryClientMock = {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setQueryData: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    reviewData = review
    statusData = status
    useRestContextMock.mockReturnValue({ formalizationService: {} } as never)
    useQueryClientMock.mockReturnValue(queryClientMock as never)
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: readonly string[] }) => {
      if (queryKey.at(-1) === 'signature-sending-review') {
        return {
          data: reviewData,
          error: null,
          isFetching: false,
          isLoading: false,
          refetch: reviewRefetch,
        } satisfies QueryResult<FormalizationSignatureSendingReviewResponse>
      }

      return {
        data: statusData,
        error: null,
        isFetching: false,
        isLoading: false,
        refetch: statusRefetch,
      } satisfies QueryResult<FormalizationSignatureSendingStatusResponse | null>
    })
    useMutationMock.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: vi.fn(),
    })
  })

  it('enables status polling independently of the full review projection', () => {
    reviewData = undefined
    renderHook(() => useFormalizationSignatureSending('formalization-1'))

    expect(useQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        enabled: true,
        queryKey: getFormalizationSignatureSendingStatusQueryKey('formalization-1'),
      }),
    )
  })

  it('keeps an explicit null status projection absent without treating it as an error', () => {
    reviewData = undefined
    statusData = null

    const { result } = renderHook(() =>
      useFormalizationSignatureSending('formalization-1'),
    )

    expect(result.current.status).toBeNull()
    expect(useQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ enabled: true }),
    )
  })

  it('hydrates cancellation pending state from the persisted status projection', () => {
    statusData = {
      ...status,
      cancellationRequestedAt: new Date('2026-09-01T10:00:00.000Z'),
    }

    const { result } = renderHook(() =>
      useFormalizationSignatureSending('formalization-1'),
    )

    expect(result.current.isCancellationPending).toBe(true)
  })

  it('polls the review while a signature request is non-terminal', () => {
    renderHook(() => useFormalizationSignatureSending('formalization-1'))

    const refetchInterval =
      getRefetchInterval<FormalizationSignatureSendingReviewResponse>(0)

    expect(refetchInterval({ state: { data: review } })).toBe(3_000)
  })

  it('polls the sending status while a signature request is non-terminal', () => {
    renderHook(() => useFormalizationSignatureSending('formalization-1'))

    const refetchInterval =
      getRefetchInterval<FormalizationSignatureSendingStatusResponse>(1)

    expect(refetchInterval({ state: { data: status } })).toBe(3_000)
  })

  it('stops regular polling when the request becomes terminal', () => {
    renderHook(() => useFormalizationSignatureSending('formalization-1'))

    const reviewRefetchInterval =
      getRefetchInterval<FormalizationSignatureSendingReviewResponse>(0)
    const statusRefetchInterval =
      getRefetchInterval<FormalizationSignatureSendingStatusResponse>(1)
    const confirmedReview = {
      ...review,
      currentRequest: review.currentRequest
        ? { ...review.currentRequest, status: 'confirmed' as const }
        : undefined,
    }
    const confirmedStatus = { ...status, status: 'confirmed' as const }

    expect(reviewRefetchInterval({ state: { data: confirmedReview } })).toBe(false)
    expect(statusRefetchInterval({ state: { data: confirmedStatus } })).toBe(false)
  })

  it('starts cancellation polling after the server accepts an asynchronous cancellation', async () => {
    const { result } = renderHook(() =>
      useFormalizationSignatureSending('formalization-1'),
    )

    const cancelOptions = useMutationMock.mock.calls[1]?.[0] as
      | MutationOptions
      | undefined
    if (!cancelOptions?.onSuccess)
      throw new Error('Expected cancellation success handler')

    await act(async () => {
      await cancelOptions.onSuccess?.({ cancellationPending: true })
    })

    expect(reviewRefetch).toHaveBeenCalledOnce()
    expect(statusRefetch).toHaveBeenCalledOnce()
    expect(result.current.isCancellationPending).toBe(true)
    const refetchInterval =
      getRefetchInterval<FormalizationSignatureSendingStatusResponse>(
        useQueryMock.mock.calls.length - 1,
      )
    expect(refetchInterval({ state: { data: status } })).toBe(1_000)
  })

  it('stops cancellation polling when the refreshed response is already terminal', async () => {
    const currentRequest = review.currentRequest
    if (!currentRequest) throw new Error('Expected a current request')

    reviewData = {
      ...review,
      currentRequest: { ...currentRequest, status: 'cancelled' },
    }
    statusData = { ...status, status: 'cancelled', canCancel: false }
    const { result } = renderHook(() =>
      useFormalizationSignatureSending('formalization-1'),
    )

    const cancelOptions = useMutationMock.mock.calls[1]?.[0] as
      | MutationOptions
      | undefined
    if (!cancelOptions?.onSuccess)
      throw new Error('Expected cancellation success handler')

    await act(async () => {
      await cancelOptions.onSuccess?.({ cancellationPending: true })
    })

    expect(result.current.isCancellationPending).toBe(false)
    const refetchInterval =
      getRefetchInterval<FormalizationSignatureSendingReviewResponse>(0)
    expect(refetchInterval({ state: { data: reviewData } })).toBe(false)
  })

  it('keeps status polling when the full review has no current request', async () => {
    reviewData = { ...review, currentRequest: undefined }
    const { result } = renderHook(() =>
      useFormalizationSignatureSending('formalization-1'),
    )

    const cancelOptions = useMutationMock.mock.calls[1]?.[0] as
      | MutationOptions
      | undefined
    if (!cancelOptions?.onSuccess)
      throw new Error('Expected cancellation success handler')

    await act(async () => {
      await cancelOptions.onSuccess?.({ cancellationPending: true })
    })

    expect(result.current.isCancellationPending).toBe(false)
    const refetchInterval =
      getRefetchInterval<FormalizationSignatureSendingStatusResponse>(
        useQueryMock.mock.calls.length - 1,
      )
    expect(refetchInterval({ state: { data: statusData ?? undefined } })).toBe(3_000)
  })

  it('keeps cancellation pending without fabricating review or status data', async () => {
    reviewData = undefined
    statusData = undefined
    const { result } = renderHook(() =>
      useFormalizationSignatureSending('formalization-1'),
    )

    const cancelOptions = useMutationMock.mock.calls[1]?.[0] as
      | MutationOptions
      | undefined
    if (!cancelOptions?.onSuccess)
      throw new Error('Expected cancellation success handler')

    await act(async () => {
      await cancelOptions.onSuccess?.({ cancellationPending: true })
    })

    expect(result.current.isCancellationPending).toBe(true)
    expect(queryClientMock.setQueryData).not.toHaveBeenCalled()
  })
})
