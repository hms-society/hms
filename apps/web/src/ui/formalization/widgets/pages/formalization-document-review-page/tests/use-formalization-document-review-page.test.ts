import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFormalizationDocumentsQuery } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useFormalizationDocumentReviewAction } from '@/ui/formalization/hooks/use-formalization-document-review-action'
import { useFormalizationDocumentVersionQuery } from '@/ui/formalization/hooks/use-formalization-document-version-query'
import { useFormalizationQuery } from '@/ui/formalization/hooks/use-formalization-query'
import { useNavigation, type Navigation } from '@/ui/shared/hooks/use-navigation'

import { useFormalizationDocumentReviewPage } from '../use-formalization-document-review-page'

vi.mock('@/ui/formalization/hooks/use-formalization-document-production-action', () => ({
  useFormalizationDocumentsQuery: vi.fn(),
}))
vi.mock('@/ui/formalization/hooks/use-formalization-document-review-action', () => ({
  useFormalizationDocumentReviewAction: vi.fn(),
}))
vi.mock('@/ui/formalization/hooks/use-formalization-document-version-query', () => ({
  useFormalizationDocumentVersionQuery: vi.fn(),
}))
vi.mock('@/ui/formalization/hooks/use-formalization-query', () => ({
  useFormalizationQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useFormalizationDocumentsQueryMock = vi.mocked(useFormalizationDocumentsQuery)
const useFormalizationDocumentReviewActionMock = vi.mocked(
  useFormalizationDocumentReviewAction,
)
const useFormalizationDocumentVersionQueryMock = vi.mocked(
  useFormalizationDocumentVersionQuery,
)
const useFormalizationQueryMock = vi.mocked(useFormalizationQuery)
const useNavigationMock = vi.mocked(useNavigation)

type ReviewAction = ReturnType<typeof useFormalizationDocumentReviewAction>
let navigateToMock: Navigation['navigateTo']

function createReviewAction(): ReviewAction {
  return {
    isRegeneratingDocument: false,
    isReviewingVersion: false,
    isSavingManualVersion: false,
    isSelectingCurrentVersion: false,
    regenerateDocument: vi.fn().mockResolvedValue({ id: 'version-2' }),
    reviewVersion: vi.fn().mockResolvedValue({ id: 'version-1' }),
    saveManualVersion: vi.fn().mockResolvedValue({ id: 'version-2' }),
    selectCurrentVersion: vi.fn().mockResolvedValue({ id: 'version-1' }),
    regenerateDocumentError: null,
    reviewVersionError: null,
    saveManualVersionError: null,
    selectCurrentVersionError: null,
  } as unknown as ReviewAction
}

describe('useFormalizationDocumentReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateToMock = vi.fn<Navigation['navigateTo']>().mockResolvedValue(undefined)
    useFormalizationQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useFormalizationQuery>)
    useFormalizationDocumentsQueryMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useFormalizationDocumentsQuery>)
    useFormalizationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: undefined,
      isLoadingDocumentVersion: false,
      isErrorDocumentVersion: false,
      refetchDocumentVersion: vi.fn(),
    } as unknown as ReturnType<typeof useFormalizationDocumentVersionQuery>)
    useFormalizationDocumentReviewActionMock.mockReturnValue(createReviewAction())
    useNavigationMock.mockReturnValue({
      navigateTo: navigateToMock,
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    } satisfies Navigation)
  })

  it('exposes the loading state and formalization back navigation', async () => {
    const { result } = renderHook(() =>
      useFormalizationDocumentReviewPage({
        formalizationId: 'formalization-1',
        documentVersionId: 'version-1',
      }),
    )

    expect(result.current.isLoading).toBe(true)

    await result.current.handleBack()

    expect(navigateToMock).toHaveBeenCalledWith('formalization', {
      params: { formalizationId: 'formalization-1' },
    })
  })
})
