import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FormalizationDocumentProductionController } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useNavigation, type Navigation } from '@/ui/shared/hooks/use-navigation'

import { useFormalizationDocumentsSection } from '../use-formalization-documents-section'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useNavigationMock = vi.mocked(useNavigation)

function createProduction() {
  const confirmMutation = { mutate: vi.fn() }
  const selectionMutation = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  }
  const documentsRefetch = vi.fn().mockResolvedValue(undefined)
  const navigateTo = vi.fn().mockResolvedValue(undefined)

  const controller = {
    documents: [],
    documentsQuery: {
      isLoading: false,
      isError: false,
      error: null,
      refetch: documentsRefetch,
    },
    selectionQuery: {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn().mockResolvedValue(undefined),
    },
    selectionMutation: {
      ...selectionMutation,
      error: null,
      isPending: false,
    },
    generationMutation: { error: null },
    cancellationMutation: {
      error: null,
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    },
    confirmMutation: {
      ...confirmMutation,
      error: null,
      isPending: false,
    },
    isPackageConfirmed: false,
    isReopeningPackage: false,
    isConfirmationEligible: true,
    isCancellingDocument: false,
    handleGenerateDocument: vi.fn().mockResolvedValue(undefined),
    reopenPackage: vi.fn().mockResolvedValue(undefined),
  } as unknown as FormalizationDocumentProductionController

  return {
    controller,
    confirmMutation,
    documentsRefetch,
    navigateTo,
    selectionMutation,
  }
}

function renderSectionHook(
  production: FormalizationDocumentProductionController,
  overrides: Partial<Parameters<typeof useFormalizationDocumentsSection>[0]> = {},
) {
  return renderHook(() =>
    useFormalizationDocumentsSection({
      formalizationId: 'formalization-1',
      formalization: { contractFormState: 'closed', version: 4 },
      intake: {},
      isTerminal: false,
      production,
      ...overrides,
    }),
  )
}

describe('useFormalizationDocumentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('derives the render guard and read-only state', () => {
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    } satisfies Navigation)
    const { controller: production } = createProduction()

    const { result: terminalResult } = renderSectionHook(production, {
      isTerminal: true,
    })
    const { result: openResult } = renderSectionHook(production, {
      formalization: { contractFormState: 'open', version: 4 },
    })

    expect(terminalResult.current.shouldRender).toBe(true)
    expect(terminalResult.current.isReadOnly).toBe(true)
    expect(openResult.current.shouldRender).toBe(false)
  })

  it('opens confirmation, confirms the expected version, and reopens the package', async () => {
    const { controller: production, confirmMutation } = createProduction()
    const reopenPackage = vi.fn().mockResolvedValue(undefined)
    production.reopenPackage = reopenPackage
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    } satisfies Navigation)

    const { result } = renderSectionHook(production)

    await act(async () => {
      await result.current.handleConfirmRequest()
    })
    act(() => result.current.handleConfirm())
    await act(async () => {
      await result.current.handleReopen()
    })

    expect(result.current.isConfirmationDialogOpen).toBe(true)
    expect(confirmMutation.mutate).toHaveBeenCalledWith(4)
    expect(reopenPackage).toHaveBeenCalledWith(4)
  })

  it('keeps document selection open when saving fails and closes it on success', async () => {
    const { controller: production, selectionMutation } = createProduction()
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    } satisfies Navigation)
    const { result } = renderSectionHook(production)

    act(() => result.current.handleOpenChange(true))
    expect(result.current.isSelectionOpen).toBe(true)

    selectionMutation.mutateAsync.mockRejectedValueOnce(new Error('save failed'))
    await act(async () => {
      await result.current.handleSaveSelection(['document-specification-1'])
    })
    expect(result.current.isSelectionOpen).toBe(true)

    selectionMutation.mutateAsync.mockResolvedValueOnce(undefined)
    await act(async () => {
      await result.current.handleSaveSelection(['document-specification-1'])
    })
    expect(result.current.isSelectionOpen).toBe(false)
  })

  it('navigates to a document version and refreshes after a package error', async () => {
    const { controller: production, documentsRefetch, navigateTo } = createProduction()
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    } satisfies Navigation)
    const { result } = renderSectionHook(production)

    await act(async () => {
      await result.current.handleOpenDocumentVersion('document-version-1')
      await result.current.handleRetry()
      await result.current.handleRefreshDocument()
    })

    expect(navigateTo).toHaveBeenCalledWith('formalizationDocumentVersion', {
      params: {
        formalizationId: 'formalization-1',
        documentVersionId: 'document-version-1',
      },
    })
    expect(documentsRefetch).toHaveBeenCalledTimes(2)
  })
})
