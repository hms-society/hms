import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'

import { getFormalizationQueryKey } from '@/ui/formalization/hooks/use-formalization-query'
import { useFormalizationSignatureConfiguration } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const { useInfiniteQueryMock, useMutationMock, useQueryClientMock, useQueryMock } =
  vi.hoisted(() => ({
    useInfiniteQueryMock: vi.fn(),
    useMutationMock: vi.fn(),
    useQueryClientMock: vi.fn(),
    useQueryMock: vi.fn(),
  }))

vi.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: useInfiniteQueryMock,
  useMutation: useMutationMock,
  useQuery: useQueryMock,
  useQueryClient: useQueryClientMock,
}))

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

const queryClientMock = {
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  refetchQueries: vi.fn().mockResolvedValue(undefined),
}

const updatedConfiguration = {
  formalizationId: 'formalization-1',
  version: 11,
  editable: true,
  status: 'configuring',
  previewPreparation: { total: 0, pending: 0, processing: 0, ready: 0, failed: 0 },
  signatories: [],
  documents: [],
  readiness: { ready: false, assignmentCount: 0, issues: [] },
} as unknown as FormalizationSignatureConfiguration

type MutationOptions = {
  readonly onSuccess?: (configuration: FormalizationSignatureConfiguration) => void
}

describe('useFormalizationSignatureConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({ formalizationService: {} } as never)
    useQueryClientMock.mockReturnValue(queryClientMock as never)
    useQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn().mockResolvedValue(undefined),
    } as never)
    useMutationMock.mockReturnValue({
      error: null,
      isPending: false,
      mutateAsync: vi.fn(),
    } as never)
  })

  it('refreshes sending review and status after every successful configuration mutation', async () => {
    renderHook(() => useFormalizationSignatureConfiguration('formalization-1'))

    const successHandlers = useMutationMock.mock.calls
      .map(([options]) => (options as MutationOptions).onSuccess)
      .filter((onSuccess): onSuccess is NonNullable<MutationOptions['onSuccess']> =>
        Boolean(onSuccess),
      )
    const formalizationQueryKey = getFormalizationQueryKey('formalization-1')
    const sendingReviewQueryKey = [
      ...formalizationQueryKey,
      'signature-sending-review',
    ] as const
    const sendingStatusQueryKey = [
      ...formalizationQueryKey,
      'signature-sending-status',
    ] as const

    expect(successHandlers).toHaveLength(8)

    await act(async () => {
      for (const onSuccess of successHandlers) onSuccess(updatedConfiguration)
      await Promise.resolve()
    })

    expect(queryClientMock.setQueryData).toHaveBeenCalledTimes(8)
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledTimes(24)
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: formalizationQueryKey,
      refetchType: 'none',
    })
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: sendingReviewQueryKey,
      refetchType: 'none',
    })
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: sendingStatusQueryKey,
      refetchType: 'none',
    })
    expect(queryClientMock.refetchQueries).toHaveBeenCalledTimes(24)
    expect(queryClientMock.refetchQueries).toHaveBeenCalledWith({
      queryKey: sendingReviewQueryKey,
      type: 'active',
    })
    expect(queryClientMock.refetchQueries).toHaveBeenCalledWith({
      queryKey: sendingStatusQueryKey,
      type: 'active',
    })
    expect(queryClientMock.refetchQueries).toHaveBeenCalledWith({
      queryKey: formalizationQueryKey,
      type: 'active',
    })
  })
})
