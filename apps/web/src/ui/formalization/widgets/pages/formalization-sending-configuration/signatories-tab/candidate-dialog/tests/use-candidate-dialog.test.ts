import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFormalizationSignatureCandidatesQuery } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

import { useCandidateDialog } from '../use-candidate-dialog'

vi.mock(
  '@/ui/formalization/hooks/use-formalization-signature-configuration-action',
  () => ({
    useFormalizationSignatureCandidatesQuery: vi.fn(),
  }),
)

const useCandidatesMock = vi.mocked(useFormalizationSignatureCandidatesQuery)

describe('useCandidateDialog', () => {
  it('queries candidates with the current search and open state', () => {
    const candidates = {
      candidates: [],
      candidatePages: [],
      candidatesError: null,
      fetchNextCandidatesPage: vi.fn(),
      hasNextCandidatePage: false,
      isErrorCandidates: false,
      isFetchingCandidates: false,
      isFetchingNextCandidatesPage: false,
      isLoadingCandidates: false,
      refetchCandidates: vi.fn(),
    }
    useCandidatesMock.mockReturnValue(candidates)

    renderHook(() =>
      useCandidateDialog({
        formalizationId: 'formalization-1',
        open: true,
        isPending: false,
        onOpenChange: vi.fn(),
        onSelect: vi.fn().mockResolvedValue(undefined),
      }),
    )

    expect(useCandidatesMock).toHaveBeenCalledWith(
      'formalization-1',
      { search: '', limit: 20 },
      true,
    )
  })
})
