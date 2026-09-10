import type { PropsWithChildren } from 'react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useChecklistLinkFields } from '../use-checklist-link-fields'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('useChecklistLinkFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({
      caseManagementService: {
        listMyCases: vi.fn().mockResolvedValue({
          isFailure: false,
          body: [
            {
              id: 'case-1',
              title: 'Caso 0089',
            },
          ],
        }),
        listCaseChecklist: vi.fn().mockResolvedValue({
          isFailure: false,
          body: [
            {
              id: 'checklist-item-1',
              title: 'Comprovante de residência',
            },
          ],
        }),
      },
    } as never)
  })

  it('loads case and checklist options for manual document linking', async () => {
    const watch = vi.fn((field: string) => {
      if (field === 'caseId') return 'case-1'
      if (field === 'checklistRequirementId') return 'checklist-item-1'
      return undefined
    })

    const { result } = renderHook(() =>
      useChecklistLinkFields({
        document: DocumentValidationDocumentFaker.fake({
          checklistLink: {
            caseLabel: 'Caso 0089',
            checklistItemLabel: 'Comprovante de residência',
          },
        }),
        form: { setValue: vi.fn(), watch } as never,
        isChecklistDisabled: true,
      }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.caseOptions).toHaveLength(1)
      expect(result.current.checklistOptions).toHaveLength(1)
    })

    expect(result.current).toMatchObject({
      caseId: 'case-1',
      caseLabel: 'Caso 0089',
      checklistItemLabel: 'Comprovante de residência',
      checklistRequirementId: 'checklist-item-1',
    })
    expect(watch).toHaveBeenCalledWith('caseId')
    expect(watch).toHaveBeenCalledWith('checklistRequirementId')
  })
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}
