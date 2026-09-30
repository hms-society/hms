import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CollaboratorSummary } from '@hms/core/identity/domain/entities'
import { RestResponse } from '@hms/core/shared/responses/rest-response'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useLawyerSelectorDialog } from '../use-lawyer-selector-dialog'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

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
  const identityService = {
    listLawyers: vi.fn(),
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

  it('loads lawyers by page and limit and appends the next page', async () => {
    identityService.listLawyers.mockImplementation(async ({ page }: { page: number }) => {
      return new RestResponse({
        body: {
          items:
            page === 1
              ? [createLawyer('lawyer-1', 'Ana Ribeiro')]
              : [createLawyer('lawyer-2', 'Bruno Costa')],
          page,
          pageSize: 10,
          total: 2,
          totalPages: 2,
        },
      })
    })

    const { result } = renderHook(
      () =>
        useLawyerSelectorDialog({
          open: true,
          onOpenChange: vi.fn(),
          onSelect: vi.fn(),
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.filteredLawyers).toHaveLength(1))
    expect(identityService.listLawyers).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
    })

    await act(async () => {
      await result.current.handleLoadMore()
    })

    await waitFor(() => expect(result.current.filteredLawyers).toHaveLength(2))
    expect(identityService.listLawyers).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: undefined,
    })
  })
})
