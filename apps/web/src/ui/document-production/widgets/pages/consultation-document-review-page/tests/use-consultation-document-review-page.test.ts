import { renderHook, act, waitFor } from '@testing-library/react'
import { DocumentGenerationStatus } from '@hms/core/document-production/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useCancelConsultationDocumentGenerationAction } from '../../../../hooks/use-cancel-consultation-document-generation-action'
import { useConsultationDocumentVersionQuery } from '../../../../hooks/use-consultation-document-version-query'
import { useConsultationDocumentsQuery } from '../../../../hooks/use-consultation-documents-query'
import { useGenerateConsultationDocumentAction } from '../../../../hooks/use-generate-consultation-document-action'
import { useReviewConsultationDocumentVersionAction } from '../../../../hooks/use-review-consultation-document-version-action'
import { useSaveManualConsultationDocumentVersionAction } from '../../../../hooks/use-save-manual-consultation-document-version-action'
import { useSelectCurrentConsultationDocumentVersionAction } from '../../../../hooks/use-select-current-consultation-document-version-action'
import { useConsultationDocumentReviewPage } from '../use-consultation-document-review-page'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))
vi.mock('../../../../hooks/use-cancel-consultation-document-generation-action', () => ({
  useCancelConsultationDocumentGenerationAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-consultation-document-version-query', () => ({
  useConsultationDocumentVersionQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-consultation-documents-query', () => ({
  useConsultationDocumentsQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-generate-consultation-document-action', () => ({
  useGenerateConsultationDocumentAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-review-consultation-document-version-action', () => ({
  useReviewConsultationDocumentVersionAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-save-manual-consultation-document-version-action', () => ({
  useSaveManualConsultationDocumentVersionAction: vi.fn(),
}))
vi.mock(
  '../../../../hooks/use-select-current-consultation-document-version-action',
  () => ({
    useSelectCurrentConsultationDocumentVersionAction: vi.fn(),
  }),
)

const useNavigationMock = vi.mocked(useNavigation)
const useCancelConsultationDocumentGenerationActionMock = vi.mocked(
  useCancelConsultationDocumentGenerationAction,
)
const useConsultationDocumentVersionQueryMock = vi.mocked(
  useConsultationDocumentVersionQuery,
)
const useConsultationDocumentsQueryMock = vi.mocked(useConsultationDocumentsQuery)
const useGenerateConsultationDocumentActionMock = vi.mocked(
  useGenerateConsultationDocumentAction,
)
const useReviewConsultationDocumentVersionActionMock = vi.mocked(
  useReviewConsultationDocumentVersionAction,
)
const useSaveManualConsultationDocumentVersionActionMock = vi.mocked(
  useSaveManualConsultationDocumentVersionAction,
)
const useSelectCurrentConsultationDocumentVersionActionMock = vi.mocked(
  useSelectCurrentConsultationDocumentVersionAction,
)

const documentContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Conteúdo da versão {client_name}.' }],
    },
  ],
}

function createVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'version-2',
    documentId: 'document-1',
    fileId: 'file-2',
    versionNumber: 2,
    source: 'ai',
    content: documentContent,
    pendingMarkers: [{ marker: '{client_name}' }],
    createdByCollaboratorId: 'collaborator-1',
    createdAt: '2026-08-14T08:18:00.000Z',
    status: 'in_review',
    ...overrides,
  }
}

function createVersionSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: 'version-2',
    versionNumber: 2,
    source: 'ai',
    status: 'in_review',
    createdAt: '2026-08-14T08:18:00.000Z',
    ...overrides,
  }
}

function createDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'document-1',
    title: 'Procuração',
    currentVersionId: 'version-2',
    versions: [
      createVersionSummary(),
      createVersionSummary({
        id: 'version-1',
        versionNumber: 1,
        status: 'approved',
      }),
    ],
    ...overrides,
  }
}

function createDocumentsQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: [createDocument()],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function createVersionQuery(overrides: Record<string, unknown> = {}) {
  return {
    documentVersion: createVersion(),
    documentVersionError: null,
    isLoadingDocumentVersion: false,
    ...overrides,
  }
}

function createReviewAction(overrides: Record<string, unknown> = {}) {
  return {
    reviewVersion: vi.fn().mockResolvedValue({ isConflict: false }),
    isReviewingVersion: false,
    error: null,
    ...overrides,
  }
}

function createSaveAction(overrides: Record<string, unknown> = {}) {
  return {
    saveManualVersion: vi.fn().mockResolvedValue({ body: { id: 'version-3' } }),
    isSavingManualVersion: false,
    error: null,
    ...overrides,
  }
}

function createGenerationAction(overrides: Record<string, unknown> = {}) {
  return {
    generateDocument: vi.fn().mockResolvedValue(undefined),
    isGeneratingDocument: false,
    pendingDocumentIds: [],
    error: null,
    ...overrides,
  }
}

function createCancellationAction(overrides: Record<string, unknown> = {}) {
  return {
    cancelDocumentGeneration: vi.fn().mockResolvedValue(undefined),
    isCancellingDocument: false,
    error: null,
    ...overrides,
  }
}

function createCurrentAction(overrides: Record<string, unknown> = {}) {
  return {
    selectCurrentVersion: vi.fn().mockResolvedValue({ isConflict: false }),
    isSelectingCurrentVersion: false,
    error: null,
    ...overrides,
  }
}

function renderReviewHook() {
  return renderHook(() =>
    useConsultationDocumentReviewPage({
      consultationId: 'consultation-1',
      documentId: 'document-1',
      documentVersionId: 'version-2',
    }),
  )
}

describe('useConsultationDocumentReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    })
    useConsultationDocumentsQueryMock.mockReturnValue(createDocumentsQuery() as never)
    useConsultationDocumentVersionQueryMock.mockReturnValue(createVersionQuery() as never)
    useReviewConsultationDocumentVersionActionMock.mockReturnValue(
      createReviewAction() as never,
    )
    useSaveManualConsultationDocumentVersionActionMock.mockReturnValue(
      createSaveAction() as never,
    )
    useGenerateConsultationDocumentActionMock.mockReturnValue(
      createGenerationAction() as never,
    )
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue(
      createCancellationAction() as never,
    )
    useSelectCurrentConsultationDocumentVersionActionMock.mockReturnValue(
      createCurrentAction() as never,
    )
  })

  it('derives the review view model and sorted history from loaded data', async () => {
    const { result } = renderReviewHook()

    await waitFor(() => expect(result.current.draft).toEqual(documentContent))

    expect(result.current.viewModel).toMatchObject({
      title: 'Procuração',
      versionNumber: 2,
      sourceLabel: 'Geração por IA',
      status: 'in_review',
      statusLabel: 'Em revisão',
      isCurrent: true,
      generationState: 'idle',
    })
    expect(result.current.history.map((item) => item.versionNumber)).toEqual([2, 1])
    expect(result.current.history[0]).toMatchObject({
      statusLabel: 'Em revisão',
      isCurrent: true,
    })
    expect(result.current.pendingMarkers).toEqual([{ marker: '{client_name}' }])
  })

  it('synchronizes a loaded version into the editable draft and resets editing state', async () => {
    const { result, rerender } = renderReviewHook()

    await waitFor(() => expect(result.current.draft).toEqual(documentContent))
    act(() => {
      result.current.handleStartEditing()
      result.current.handleContentChange({ type: 'doc', content: [] })
    })

    expect(result.current.isEditing).toBe(true)
    expect(result.current.isDirty).toBe(true)

    const nextVersion = createVersion({
      id: 'version-1',
      versionNumber: 1,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    })
    useConsultationDocumentVersionQueryMock.mockReturnValue(
      createVersionQuery({ documentVersion: nextVersion }) as never,
    )
    rerender()

    await waitFor(() => expect(result.current.version?.id).toBe('version-1'))
    expect(result.current.isEditing).toBe(false)
    expect(result.current.isDirty).toBe(false)
    expect(result.current.draft).toEqual(nextVersion.content)
  })

  it('protects dirty navigation and navigates after confirming draft cancellation', async () => {
    const navigateToMock = vi.fn().mockResolvedValue(undefined)
    useNavigationMock.mockReturnValue({
      navigateTo: navigateToMock,
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    })
    const { result } = renderReviewHook()

    await waitFor(() => expect(result.current.draft).toEqual(documentContent))
    act(() => result.current.handleStartEditing())
    act(() => result.current.handleContentChange({ type: 'doc', content: [] }))
    act(() => result.current.handleVersionNavigation('version-1'))

    expect(result.current.isCancelOpen).toBe(true)
    expect(navigateToMock).not.toHaveBeenCalled()

    await act(async () => {
      result.current.handleConfirmCancel()
    })

    await waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith('consultationDocumentVersion', {
        params: {
          consultationId: 'consultation-1',
          documentId: 'document-1',
          documentVersionId: 'version-1',
        },
      }),
    )
    expect(result.current.isEditing).toBe(false)
    expect(result.current.isCancelOpen).toBe(false)
  })

  it('submits approval and rejection decisions with the current context', async () => {
    const reviewAction = createReviewAction()
    useReviewConsultationDocumentVersionActionMock.mockReturnValue(reviewAction as never)
    const { result } = renderReviewHook()

    act(() => result.current.handleApprove())
    expect(result.current.isApproveOpen).toBe(true)

    await act(async () => {
      await result.current.handleConfirmApprove()
    })
    expect(reviewAction.reviewVersion).toHaveBeenCalledWith({
      consultationId: 'consultation-1',
      documentId: 'document-1',
      documentVersionId: 'version-2',
      request: { decision: 'approved' },
    })
    expect(result.current.isApproveOpen).toBe(false)

    act(() => {
      result.current.handleReject()
      result.current.setRejectionReason('Ajustar a qualificação das partes.')
    })
    await act(async () => {
      await result.current.handleConfirmReject()
    })

    expect(reviewAction.reviewVersion).toHaveBeenLastCalledWith({
      consultationId: 'consultation-1',
      documentId: 'document-1',
      documentVersionId: 'version-2',
      request: {
        decision: 'rejected',
        rejectionReason: 'Ajustar a qualificação das partes.',
      },
    })
    expect(result.current.rejectionReason).toBe('')
  })

  it('maps a review conflict to refreshed data and a visible action error', async () => {
    const documentsRefetchMock = vi.fn().mockResolvedValue(undefined)
    const versionRefetchMock = vi.fn().mockResolvedValue(undefined)
    const reviewAction = createReviewAction({
      reviewVersion: vi.fn().mockResolvedValue({ isConflict: true }),
    })
    useReviewConsultationDocumentVersionActionMock.mockReturnValue(reviewAction as never)
    useConsultationDocumentsQueryMock.mockReturnValue(
      createDocumentsQuery({ refetch: documentsRefetchMock }) as never,
    )
    useConsultationDocumentVersionQueryMock.mockReturnValue(
      createVersionQuery({ refetch: versionRefetchMock }) as never,
    )
    const { result } = renderReviewHook()

    await act(async () => {
      await result.current.handleConfirmApprove()
    })

    expect(documentsRefetchMock).toHaveBeenCalledOnce()
    expect(versionRefetchMock).toHaveBeenCalledOnce()
    expect(result.current.actionError).toContain('Conflito')
  })

  it('derives active generation and clears it after cancellation', async () => {
    const documentsRefetchMock = vi.fn().mockResolvedValue(undefined)
    const cancellationAction = createCancellationAction()
    useConsultationDocumentsQueryMock.mockReturnValue(
      createDocumentsQuery({
        refetch: documentsRefetchMock,
        data: [createDocument({ generationStatus: DocumentGenerationStatus.Running })],
      }) as never,
    )
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue(
      cancellationAction as never,
    )
    const { result } = renderReviewHook()

    expect(result.current.viewModel).toMatchObject({
      isGenerating: true,
      generationState: 'generating',
    })

    await act(async () => {
      await result.current.handleCancelGeneration()
    })

    expect(cancellationAction.cancelDocumentGeneration).toHaveBeenCalledWith('document-1')
    expect(documentsRefetchMock).toHaveBeenCalledOnce()
    expect(result.current.viewModel?.isGenerating).toBe(false)
  })

  it('exposes failed generation and retries with the document context', async () => {
    const generationAction = createGenerationAction()
    useConsultationDocumentsQueryMock.mockReturnValue(
      createDocumentsQuery({
        data: [createDocument({ generationStatus: DocumentGenerationStatus.Failed })],
      }) as never,
    )
    useGenerateConsultationDocumentActionMock.mockReturnValue(generationAction as never)
    const { result } = renderReviewHook()

    expect(result.current.viewModel).toMatchObject({
      isGenerationFailed: true,
      generationState: 'failed',
    })

    act(() => result.current.handleRequestRegenerate())
    act(() => result.current.setRegenerationInstructions('Corrigir a qualificação.'))
    await act(async () => {
      await result.current.handleConfirmRegenerate('Corrigir a qualificação.')
    })

    expect(generationAction.generateDocument).toHaveBeenCalledWith({
      documentId: 'document-1',
      instructions: 'Corrigir a qualificação.',
    })
    expect(result.current.isRegenerateOpen).toBe(false)
  })

  it('locates present markers and reports markers that are absent', async () => {
    const { result } = renderReviewHook()

    await waitFor(() => expect(result.current.draft).toEqual(documentContent))
    act(() => result.current.handleLocateMarker('{client_name}'))
    expect(result.current.highlightedTerms).toEqual(['{client_name}'])
    expect(result.current.isMarkerNotFoundOpen).toBe(false)

    act(() => result.current.handleLocateMarker('{missing_marker}'))
    expect(result.current.highlightedTerms).toEqual(['{client_name}'])
    expect(result.current.isMarkerNotFoundOpen).toBe(true)
  })
})
