import type {
  FormalizationSignatureConfiguration,
  FormalizationSignatureFieldView,
} from '@hms/core/formalization/domain/structures'
import type { CommunicationChannel } from '@hms/core/communication/domain/structures'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useRef } from 'react'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { getFormalizationQueryKey } from './use-formalization-query'

const PREPARATION_POLL_INTERVAL_MS = 2_000
const PREPARATION_POLL_TIMEOUT_MS = 2 * 60 * 1_000

export function getFormalizationSignatureConfigurationQueryKey(formalizationId: string) {
  return ['formalization', 'detail', formalizationId, 'signature-configuration'] as const
}

export function getFormalizationSignatureCandidatesQueryKey(
  formalizationId: string,
  query: { readonly limit?: number; readonly search?: string } = {},
) {
  return [
    'formalization',
    'detail',
    formalizationId,
    'signature-candidates',
    query.limit ?? 20,
    query.search?.trim() ?? '',
  ] as const
}

export function getFormalizationSignaturePreviewContentQueryKey(
  formalizationId: string,
  previewId: string,
) {
  return [
    'formalization',
    'detail',
    formalizationId,
    'signature-preview-content',
    previewId,
  ] as const
}

type ResponseError = Error & { statusCode?: number }

function throwResponseError(response: {
  readonly statusCode: number
  readonly throwError: () => never
}): never {
  try {
    response.throwError()
  } catch (error) {
    if (error instanceof Error) {
      Object.assign(error as ResponseError, { statusCode: response.statusCode })
    }

    throw error
  }
}

type SignatureConfigurationMutation = {
  readonly expectedVersion: number
}

type ReplaceSignatoryDocumentsInput = SignatureConfigurationMutation & {
  readonly signatoryId: string
  readonly documentIds: readonly string[]
}

type SelectSignatoryChannelInput = SignatureConfigurationMutation & {
  readonly signatoryId: string
  readonly channel: CommunicationChannel
  readonly selected: boolean
}

type ReplaceSignatureFieldsInput = SignatureConfigurationMutation & {
  readonly documentId: string
  readonly previewId: string
  readonly fields: readonly FormalizationSignatureFieldView[]
}

type AddSignatoryInput = SignatureConfigurationMutation & {
  readonly personId: string
}

type RemoveSignatoryInput = SignatureConfigurationMutation & {
  readonly signatoryId: string
}

type RetryPreviewInput = SignatureConfigurationMutation & {
  readonly previewId: string
}

function readResponse<Body>(response: {
  readonly isFailure: boolean
  readonly body: Body
  readonly statusCode: number
  readonly throwError: () => never
}): Body {
  if (response.isFailure) throwResponseError(response)
  return response.body
}

export function useFormalizationSignatureConfiguration(
  formalizationId: string,
  isAvailable = true,
) {
  const { formalizationService } = useRestContext()
  const queryClient = useQueryClient()
  const preparationStartedAtRef = useRef<number | undefined>(undefined)

  const configurationQuery = useQuery({
    queryKey: getFormalizationSignatureConfigurationQueryKey(formalizationId),
    enabled: Boolean(formalizationId) && isAvailable,
    retry: false,
    queryFn: async function getSignatureConfiguration() {
      const response =
        await formalizationService.getSignatureConfiguration(formalizationId)
      return readResponse(response)
    },
    refetchInterval: (query) => {
      if (query.state.data?.status !== 'preparing_configuration') {
        preparationStartedAtRef.current = undefined
        return false
      }

      const startedAt = preparationStartedAtRef.current ?? Date.now()
      preparationStartedAtRef.current = startedAt

      return Date.now() - startedAt < PREPARATION_POLL_TIMEOUT_MS
        ? PREPARATION_POLL_INTERVAL_MS
        : false
    },
  })

  function primeConfiguration(configuration: FormalizationSignatureConfiguration) {
    queryClient.setQueryData(
      getFormalizationSignatureConfigurationQueryKey(formalizationId),
      configuration,
    )
  }

  function invalidateAfterConfigurationMutation(
    configuration: FormalizationSignatureConfiguration,
  ) {
    primeConfiguration(configuration)
    void queryClient
      .invalidateQueries({
        queryKey: getFormalizationQueryKey(formalizationId),
      })
      .catch(() => undefined)
  }

  function recoverConfigurationConflict() {
    void Promise.all([
      configurationQuery.refetch(),
      queryClient.invalidateQueries({
        queryKey: getFormalizationQueryKey(formalizationId),
      }),
    ]).catch(() => undefined)
  }

  function handleMutationError(error: unknown) {
    if (
      error instanceof Error &&
      (error as ResponseError).statusCode === HTTP_STATUS_CODE.conflict
    ) {
      recoverConfigurationConflict()
    }
  }

  function createMutationOptions() {
    return {
      onSuccess: invalidateAfterConfigurationMutation,
      onError: handleMutationError,
    }
  }

  const initializeMutation = useMutation({
    ...createMutationOptions(),
    mutationFn: async (expectedVersion: number) => {
      const response = await formalizationService.initializeSignatureConfiguration(
        formalizationId,
        expectedVersion,
      )
      return readResponse(response)
    },
  })

  const addSignatoryMutation = useMutation({
    ...createMutationOptions(),
    mutationFn: async ({ personId, expectedVersion }: AddSignatoryInput) => {
      const response = await formalizationService.addSignatureSignatory(formalizationId, {
        personId,
        expectedVersion,
      })
      return readResponse(response)
    },
  })

  const removeSignatoryMutation = useMutation({
    ...createMutationOptions(),
    mutationFn: async ({ signatoryId, expectedVersion }: RemoveSignatoryInput) => {
      const response = await formalizationService.removeSignatureSignatory(
        formalizationId,
        signatoryId,
        expectedVersion,
      )
      return readResponse(response)
    },
  })

  const replaceDocumentsMutation = useMutation({
    ...createMutationOptions(),
    mutationFn: async ({
      signatoryId,
      documentIds,
      expectedVersion,
    }: ReplaceSignatoryDocumentsInput) => {
      const response = await formalizationService.replaceSignatureSignatoryDocuments(
        formalizationId,
        signatoryId,
        { documentIds, expectedVersion },
      )
      return readResponse(response)
    },
  })

  const selectChannelMutation = useMutation({
    ...createMutationOptions(),
    mutationFn: async ({
      signatoryId,
      channel,
      selected,
      expectedVersion,
    }: SelectSignatoryChannelInput) => {
      const response = await formalizationService.selectSignatureSignatoryChannel(
        formalizationId,
        signatoryId,
        { channel, selected, expectedVersion },
      )
      return readResponse(response)
    },
  })

  const replaceFieldsMutation = useMutation({
    ...createMutationOptions(),
    mutationFn: async ({
      documentId,
      previewId,
      fields,
      expectedVersion,
    }: ReplaceSignatureFieldsInput) => {
      const response = await formalizationService.replaceSignatureFields(
        formalizationId,
        documentId,
        { previewId, fields, expectedVersion },
      )
      return readResponse(response)
    },
  })

  const retryPreviewMutation = useMutation({
    ...createMutationOptions(),
    mutationFn: async ({ previewId, expectedVersion }: RetryPreviewInput) => {
      const response = await formalizationService.retrySignaturePreview(
        formalizationId,
        previewId,
        expectedVersion,
      )
      return readResponse(response)
    },
  })

  const resetMutation = useMutation({
    ...createMutationOptions(),
    mutationFn: async (expectedVersion: number) => {
      const response = await formalizationService.resetSignatureConfiguration(
        formalizationId,
        expectedVersion,
      )
      return readResponse(response)
    },
  })

  const configuration = configurationQuery.data
  const configurationError = configurationQuery.error
  const isInitializationRequired =
    configurationError instanceof Error &&
    (configurationError as ResponseError).statusCode === HTTP_STATUS_CODE.conflict

  return {
    configuration,
    configurationError,
    configurationQuery,
    isConfigurationError: configurationQuery.isError,
    isFetchingConfiguration: configurationQuery.isFetching,
    isInitializationRequired,
    isLoadingConfiguration: configurationQuery.isLoading,
    isPreparingConfiguration: configuration?.status === 'preparing_configuration',
    isPreparationPollingTimedOut:
      configuration?.status === 'preparing_configuration' &&
      preparationStartedAtRef.current !== undefined &&
      Date.now() - preparationStartedAtRef.current >= PREPARATION_POLL_TIMEOUT_MS,
    initializeConfiguration: initializeMutation.mutateAsync,
    isInitializingConfiguration: initializeMutation.isPending,
    initializationError: initializeMutation.error,
    addSignatory: addSignatoryMutation.mutateAsync,
    isAddingSignatory: addSignatoryMutation.isPending,
    addSignatoryError: addSignatoryMutation.error,
    removeSignatory: removeSignatoryMutation.mutateAsync,
    isRemovingSignatory: removeSignatoryMutation.isPending,
    removeSignatoryError: removeSignatoryMutation.error,
    replaceSignatoryDocuments: replaceDocumentsMutation.mutateAsync,
    isReplacingSignatoryDocuments: replaceDocumentsMutation.isPending,
    replaceSignatoryDocumentsError: replaceDocumentsMutation.error,
    selectSignatoryChannel: selectChannelMutation.mutateAsync,
    isSelectingSignatoryChannel: selectChannelMutation.isPending,
    selectSignatoryChannelError: selectChannelMutation.error,
    replaceSignatureFields: replaceFieldsMutation.mutateAsync,
    isReplacingSignatureFields: replaceFieldsMutation.isPending,
    replaceSignatureFieldsError: replaceFieldsMutation.error,
    retrySignaturePreview: retryPreviewMutation.mutateAsync,
    isRetryingSignaturePreview: retryPreviewMutation.isPending,
    retrySignaturePreviewError: retryPreviewMutation.error,
    resetSignatureConfiguration: resetMutation.mutateAsync,
    isResettingSignatureConfiguration: resetMutation.isPending,
    resetSignatureConfigurationError: resetMutation.error,
    refetchConfiguration: configurationQuery.refetch,
  }
}

export function useFormalizationSignatureCandidatesQuery(
  formalizationId: string,
  query: { readonly limit?: number; readonly search?: string },
  isEnabled = true,
) {
  const { formalizationService } = useRestContext()
  const candidateQuery = useInfiniteQuery({
    queryKey: getFormalizationSignatureCandidatesQueryKey(formalizationId, query),
    enabled: Boolean(formalizationId) && isEnabled,
    initialPageParam: 1,
    retry: false,
    queryFn: async function listSignatureCandidates({ pageParam }) {
      const response = await formalizationService.listSignatureCandidates(
        formalizationId,
        {
          page: pageParam,
          limit: query.limit,
          search: query.search?.trim() || undefined,
        },
      )
      return readResponse(response)
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1
      return nextPage * lastPage.limit <= lastPage.total ? nextPage : undefined
    },
  })

  return {
    candidates: candidateQuery.data?.pages.flatMap((page) => page.items) ?? [],
    candidatePages: candidateQuery.data?.pages ?? [],
    candidatesError: candidateQuery.error,
    fetchNextCandidatesPage: candidateQuery.fetchNextPage,
    hasNextCandidatePage: candidateQuery.hasNextPage,
    isErrorCandidates: candidateQuery.isError,
    isFetchingCandidates: candidateQuery.isFetching,
    isFetchingNextCandidatesPage: candidateQuery.isFetchingNextPage,
    isLoadingCandidates: candidateQuery.isLoading,
    refetchCandidates: candidateQuery.refetch,
  }
}

export function useFormalizationSignaturePreviewContentQuery(
  formalizationId: string,
  previewId?: string,
) {
  const { formalizationService } = useRestContext()
  const query = useQuery({
    queryKey: getFormalizationSignaturePreviewContentQueryKey(
      formalizationId,
      previewId ?? '',
    ),
    enabled: Boolean(formalizationId && previewId),
    retry: false,
    queryFn: async function getSignaturePreviewContent() {
      const response = await formalizationService.getSignaturePreviewContent(
        formalizationId,
        previewId as string,
      )
      return readResponse(response)
    },
    gcTime: 5_000,
    staleTime: 0,
  })

  return {
    previewContent: query.data,
    previewContentError: query.error,
    isLoadingPreviewContent: query.isLoading,
    isFetchingPreviewContent: query.isFetching,
    isErrorPreviewContent: query.isError,
    refetchPreviewContent: query.refetch,
  }
}

export type FormalizationSignatureConfigurationController = ReturnType<
  typeof useFormalizationSignatureConfiguration
>
