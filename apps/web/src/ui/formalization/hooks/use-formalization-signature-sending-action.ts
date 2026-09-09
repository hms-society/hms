import type {
  CancelFormalizationSignatureSendingCommand,
  ConfirmFormalizationSignatureSendingCommand,
  FormalizationSignatureRequestStatus,
} from '@hms/core/formalization/domain/structures'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { getFormalizationQueryKey } from './use-formalization-query'
import { getFormalizationSignatureConfigurationQueryKey } from './use-formalization-signature-configuration-action'

type ResponseError = Error & { statusCode?: number }

const CANCELLATION_POLL_INTERVAL_MS = 1_000
const SIGNATURE_SENDING_POLL_INTERVAL_MS = 3_000
const TERMINAL_REQUEST_STATUSES = new Set<FormalizationSignatureRequestStatus>([
  'confirmed',
  'rejected',
  'cancelled',
  'expired',
  'failed',
])

function getSignatureSendingPollInterval(
  status: FormalizationSignatureRequestStatus | undefined,
  isCancellationPending: boolean,
) {
  if (isCancellationPending) return CANCELLATION_POLL_INTERVAL_MS

  return status && !TERMINAL_REQUEST_STATUSES.has(status)
    ? SIGNATURE_SENDING_POLL_INTERVAL_MS
    : false
}

function readResponse<Body>(response: {
  readonly isFailure: boolean
  readonly body: Body
  readonly statusCode: number
  readonly throwError: () => never
}): Body {
  if (!response.isFailure) return response.body

  try {
    response.throwError()
  } catch (error) {
    if (error instanceof Error) {
      Object.assign(error as ResponseError, { statusCode: response.statusCode })
    }
    throw error
  }
}

export function getFormalizationSignatureSendingReviewQueryKey(formalizationId: string) {
  return ['formalization', 'detail', formalizationId, 'signature-sending-review'] as const
}

export function getFormalizationSignatureSendingStatusQueryKey(formalizationId: string) {
  return ['formalization', 'detail', formalizationId, 'signature-sending-status'] as const
}

export function useFormalizationSignatureSending(
  formalizationId: string,
  enabled = true,
) {
  const { formalizationService } = useRestContext()
  const queryClient = useQueryClient()
  const [isCancellationPending, setIsCancellationPending] = useState(false)
  const reviewQuery = useQuery({
    queryKey: getFormalizationSignatureSendingReviewQueryKey(formalizationId),
    enabled: Boolean(formalizationId) && enabled,
    retry: false,
    refetchInterval: (query) =>
      getSignatureSendingPollInterval(
        query.state.data?.currentRequest?.status,
        isCancellationPending,
      ),
    queryFn: async () =>
      readResponse(await formalizationService.getSignatureSendingReview(formalizationId)),
  })

  const statusQuery = useQuery({
    queryKey: getFormalizationSignatureSendingStatusQueryKey(formalizationId),
    enabled:
      Boolean(formalizationId) && enabled && Boolean(reviewQuery.data?.currentRequest),
    retry: false,
    refetchInterval: (query) => {
      if (!reviewQuery.data?.currentRequest) return false

      return getSignatureSendingPollInterval(
        query.state.data?.status ?? reviewQuery.data.currentRequest.status,
        isCancellationPending,
      )
    },
    queryFn: async () =>
      readResponse(await formalizationService.getSignatureSendingStatus(formalizationId)),
  })

  async function invalidateSendingQueries() {
    try {
      const [reviewResult, statusResult] = await Promise.all([
        reviewQuery.refetch(),
        statusQuery.refetch(),
        queryClient.invalidateQueries({
          queryKey: getFormalizationQueryKey(formalizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: getFormalizationSignatureConfigurationQueryKey(formalizationId),
        }),
      ])

      return {
        review: reviewResult.data,
        status: statusResult.data,
      }
    } catch {
      return {
        review: reviewQuery.data,
        status: statusQuery.data,
      }
    }
  }

  const reviewHasNoCurrentRequest =
    reviewQuery.data !== undefined && reviewQuery.data.currentRequest === undefined
  const currentRequestStatus = reviewQuery.data?.currentRequest?.status
  const observedRequestStatus = currentRequestStatus ?? statusQuery.data?.status

  useEffect(() => {
    if (!isCancellationPending) return

    if (
      reviewHasNoCurrentRequest ||
      (observedRequestStatus && TERMINAL_REQUEST_STATUSES.has(observedRequestStatus))
    ) {
      setIsCancellationPending(false)
    }
  }, [isCancellationPending, observedRequestStatus, reviewHasNoCurrentRequest])

  const confirmMutation = useMutation({
    mutationFn: async (input: ConfirmFormalizationSignatureSendingCommand) =>
      readResponse(
        await formalizationService.confirmSignatureSending(formalizationId, input),
      ),
    onSuccess: invalidateSendingQueries,
  })

  const cancelMutation = useMutation({
    mutationFn: async (input: CancelFormalizationSignatureSendingCommand) =>
      readResponse(
        await formalizationService.cancelSignatureSending(formalizationId, input),
      ),
    onSuccess: async (response) => {
      const refreshed = await invalidateSendingQueries()
      const reviewWasLoaded =
        refreshed.review !== undefined || reviewQuery.data !== undefined
      const currentRequest =
        refreshed.review !== undefined
          ? refreshed.review.currentRequest
          : reviewQuery.data?.currentRequest
      const status = currentRequest?.status ?? refreshed.status?.status
      setIsCancellationPending(
        response.cancellationPending &&
          (!reviewWasLoaded || Boolean(currentRequest)) &&
          (!status || !TERMINAL_REQUEST_STATUSES.has(status)),
      )
    },
  })

  return {
    review: reviewQuery.data,
    status: statusQuery.data,
    reviewError: reviewQuery.error,
    statusError: statusQuery.error,
    isLoadingReview: reviewQuery.isLoading,
    isFetchingReview: reviewQuery.isFetching,
    isLoadingStatus: statusQuery.isLoading,
    isConfirming: confirmMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isCancellationPending,
    confirmError: confirmMutation.error,
    cancelError: cancelMutation.error,
    confirmSending: confirmMutation.mutateAsync,
    cancelSending: cancelMutation.mutateAsync,
    refetchReview: reviewQuery.refetch,
    refetchStatus: statusQuery.refetch,
  }
}

export type FormalizationSignatureSendingController = ReturnType<
  typeof useFormalizationSignatureSending
>
