import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { useIntakeLawyersQuery } from '@/ui/intake/hooks/use-intake-lawyers-query'

import { useLawyerSelectorDialog } from '../use-lawyer-selector-dialog'

vi.mock('@/ui/intake/hooks/use-intake-lawyers-query', () => ({
  useIntakeLawyersQuery: vi.fn(),
}))

const useIntakeLawyersQueryMock = vi.mocked(useIntakeLawyersQuery)

function createLawyer(
  collaboratorId: string,
  professionalName: string,
): CollaboratorSummary {
  return {
    collaboratorId,
    professionalName,
    email: `${collaboratorId}@example.com`,
    profile: 'lawyer',
    status: 'active',
    legalExpertises: [
      {
        legalArea: { id: 'area-id', name: 'Direito Civil', active: true },
        legalTopics: [{ id: 'topic-id', name: 'Contratos', active: true }],
      },
    ],
  }
}

describe('useLawyerSelectorDialog', () => {
  const fetchNextPage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useIntakeLawyersQueryMock.mockReturnValue({
      hasNextPage: true,
      intakeLawyerPages: [
        {
          items: [createLawyer('lawyer-1', 'Ana Ribeiro')],
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 2,
        },
      ],
      intakeLawyersError: null,
      isFetchingNextPage: false,
      isLoadingIntakeLawyers: false,
      fetchNextPage,
      refetchIntakeLawyers: vi.fn(),
    })
  })

  it('maps loaded lawyers and delegates pagination to the feature query', async () => {
    const { result } = renderHook(() =>
      useLawyerSelectorDialog({
        open: true,
        onOpenChange: vi.fn(),
        onSelect: vi.fn(),
      }),
    )

    expect(result.current.filteredLawyers).toHaveLength(1)
    expect(result.current.filteredLawyers[0]?.label).toBe('Ana Ribeiro')

    await act(async () => {
      await result.current.handleLoadMore()
    })

    expect(fetchNextPage).toHaveBeenCalledOnce()
  })
})
