import { renderHook, act } from '@testing-library/react'
import { DocumentGenerationStatus } from '@hms/core/document-production/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useConsultationDocumentsQuery } from '../../../../hooks/use-consultation-documents-query'
import { useCancelConsultationDocumentGenerationAction } from '../../../../hooks/use-cancel-consultation-document-generation-action'
import { useConsultationDocumentSelectionQuery } from '../../../../hooks/use-consultation-document-selection-query'
import { useGenerateConsultationDocumentAction } from '../../../../hooks/use-generate-consultation-document-action'
import { useGenerateConsultationDocumentsAction } from '../../../../hooks/use-generate-consultation-documents-action'
import { useReplaceConsultationDocumentSelectionAction } from '../../../../hooks/use-replace-consultation-document-selection-action'
import { useConsultationDocumentsPage } from '../use-consultation-documents-page'

vi.mock('../../../../hooks/use-consultation-documents-query', () => ({
  useConsultationDocumentsQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-cancel-consultation-document-generation-action', () => ({
  useCancelConsultationDocumentGenerationAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-generate-consultation-document-action', () => ({
  useGenerateConsultationDocumentAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-generate-consultation-documents-action', () => ({
  useGenerateConsultationDocumentsAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-consultation-document-selection-query', () => ({
  useConsultationDocumentSelectionQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-replace-consultation-document-selection-action', () => ({
  useReplaceConsultationDocumentSelectionAction: vi.fn(),
}))

const useConsultationDocumentsQueryMock = vi.mocked(useConsultationDocumentsQuery)
const useCancelConsultationDocumentGenerationActionMock = vi.mocked(
  useCancelConsultationDocumentGenerationAction,
)
const useConsultationDocumentSelectionQueryMock = vi.mocked(
  useConsultationDocumentSelectionQuery,
)
const useGenerateConsultationDocumentActionMock = vi.mocked(
  useGenerateConsultationDocumentAction,
)
const useGenerateConsultationDocumentsActionMock = vi.mocked(
  useGenerateConsultationDocumentsAction,
)
const useReplaceConsultationDocumentSelectionActionMock = vi.mocked(
  useReplaceConsultationDocumentSelectionAction,
)

function createVersion(
  overrides: Partial<{
    id: string
    versionNumber: number
    status: 'in_review' | 'approved' | 'rejected'
    source: 'ai' | 'manual'
    rejectionReason: string
  }> = {},
) {
  return {
    id: 'version-1',
    versionNumber: 1,
    source: 'ai' as const,
    status: 'approved' as const,
    pendingMarkersCount: 0,
    createdByCollaboratorId: 'collaborator-1',
    createdAt: '2026-08-01T12:00:00.000Z',
    ...overrides,
  }
}

function createQueryResult(data: readonly unknown[] = []) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
  }
}

function createIndividualAction(overrides: Record<string, unknown> = {}) {
  return {
    generateDocument: vi.fn().mockResolvedValue(undefined),
    error: null,
    isGeneratingDocument: false,
    pendingDocumentIds: [],
    timedOutDocumentIds: [],
    ...overrides,
  }
}

function createBatchAction(overrides: Record<string, unknown> = {}) {
  return {
    generateDocuments: vi.fn().mockResolvedValue(undefined),
    error: null,
    isGeneratingDocuments: false,
    pendingDocumentIds: [],
    timedOutDocumentIds: [],
    ...overrides,
  }
}

function createCancellationAction(overrides: Record<string, unknown> = {}) {
  return {
    cancelDocumentGeneration: vi.fn().mockResolvedValue(undefined),
    error: null,
    isCancellingDocument: false,
    ...overrides,
  }
}

describe('useConsultationDocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useConsultationDocumentsQueryMock.mockReturnValue(createQueryResult() as never)
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue(
      createCancellationAction() as never,
    )
    useConsultationDocumentSelectionQueryMock.mockReturnValue(
      createQueryResult() as never,
    )
    useReplaceConsultationDocumentSelectionActionMock.mockReturnValue({
      replaceSelection: vi.fn().mockResolvedValue(undefined),
      isReplacing: false,
      error: null,
    } as never)
    useGenerateConsultationDocumentActionMock.mockReturnValue(
      createIndividualAction() as never,
    )
    useGenerateConsultationDocumentsActionMock.mockReturnValue(
      createBatchAction() as never,
    )
  })

  it('derives the status from the highest version number without mutating history', () => {
    const olderApprovedVersion = createVersion({
      id: 'version-1',
      versionNumber: 1,
      status: 'approved',
    })
    const newestReviewVersion = createVersion({
      id: 'version-3',
      versionNumber: 3,
      status: 'in_review',
    })
    const documents = [
      {
        id: 'document-1',
        title: 'Procuração',
        currentVersionId: 'version-1',
        versions: [newestReviewVersion, olderApprovedVersion],
      },
    ]
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult(documents) as never,
    )

    const { result } = renderHook(() =>
      useConsultationDocumentsPage({ consultationId: 'consultation-1' }),
    )

    expect(result.current.documents[0]).toMatchObject({
      status: 'in_review',
      statusLabel: 'Em revisão',
      latestVersion: newestReviewVersion,
      isCurrent: false,
    })
    expect(documents[0]?.versions).toEqual([newestReviewVersion, olderApprovedVersion])
  })

  it('exposes all persisted states and keeps generating separate from persisted status', () => {
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult([
        { id: 'document-1', title: 'Não gerado', versions: [] },
        {
          id: 'document-2',
          title: 'Rejeitado',
          versions: [createVersion({ id: 'version-2', status: 'rejected' })],
        },
        {
          id: 'document-3',
          title: 'Aprovado vigente',
          currentVersionId: 'version-3',
          versions: [createVersion({ id: 'version-3', status: 'approved' })],
        },
        {
          id: 'document-4',
          title: 'Gerando',
          versions: [createVersion({ id: 'version-4', status: 'approved' })],
        },
      ]) as never,
    )
    useGenerateConsultationDocumentActionMock.mockReturnValue(
      createIndividualAction({ pendingDocumentIds: ['document-4'] }) as never,
    )

    const { result } = renderHook(() =>
      useConsultationDocumentsPage({ consultationId: 'consultation-1' }),
    )

    expect(result.current.documents.map((item) => item.status)).toEqual([
      'not_generated',
      'rejected',
      'approved',
      'generating',
    ])
    expect(result.current.documents[2]?.isCurrent).toBe(true)
    expect(result.current.documents[3]?.statusLabel).toBe('Gerando')
  })

  it('derives generating from an active persisted generation status', () => {
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult([
        {
          id: 'document-1',
          title: 'Procuração',
          generationStatus: DocumentGenerationStatus.Running,
          versions: [],
        },
      ]) as never,
    )

    const { result } = renderHook(() =>
      useConsultationDocumentsPage({ consultationId: 'consultation-1' }),
    )

    expect(result.current.documents[0]).toMatchObject({
      status: 'generating',
      statusLabel: 'Gerando',
      isGenerating: true,
    })
  })

  it('keeps timeout recoverable without deriving a persisted failure state', () => {
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult([{ id: 'document-1', title: 'Contrato', versions: [] }]) as never,
    )
    const refetch = vi.fn().mockResolvedValue(undefined)
    useConsultationDocumentsQueryMock.mockReturnValue({
      ...createQueryResult([{ id: 'document-1', title: 'Contrato', versions: [] }]),
      refetch,
    } as never)
    useGenerateConsultationDocumentActionMock.mockReturnValue(
      createIndividualAction({ timedOutDocumentIds: ['document-1'] }) as never,
    )

    const { result } = renderHook(() =>
      useConsultationDocumentsPage({ consultationId: 'consultation-1' }),
    )

    expect(result.current.documents[0]).toMatchObject({
      status: 'not_generated',
      isTimedOut: true,
    })
    expect(result.current.documents[0]?.statusLabel).not.toBe('Falha na geração')

    act(() => {
      void result.current.handleRefresh()
    })
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('delegates individual and batch generation with the consultation context', async () => {
    const individual = createIndividualAction()
    const batch = createBatchAction()
    useGenerateConsultationDocumentActionMock.mockReturnValue(individual as never)
    useGenerateConsultationDocumentsActionMock.mockReturnValue(batch as never)

    const { result } = renderHook(() =>
      useConsultationDocumentsPage({ consultationId: 'consultation-1' }),
    )

    await act(async () => {
      await result.current.handleGenerateDocument('document-1')
      await result.current.handleGenerateDocuments()
    })

    expect(individual.generateDocument).toHaveBeenCalledWith({ documentId: 'document-1' })
    expect(batch.generateDocuments).toHaveBeenCalledOnce()
  })

  it('delegates cancellation with the consultation context', async () => {
    const cancellation = createCancellationAction()
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue(
      cancellation as never,
    )

    const { result } = renderHook(() =>
      useConsultationDocumentsPage({ consultationId: 'consultation-1' }),
    )

    await act(async () => {
      await result.current.handleCancelDocumentGeneration('document-1')
    })

    expect(cancellation.cancelDocumentGeneration).toHaveBeenCalledWith('document-1')
  })

  it('clears the local generating state after cancelling the current attempt', async () => {
    const cancellation = createCancellationAction()
    useConsultationDocumentSelectionQueryMock.mockReturnValue(
      createQueryResult() as never,
    )
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult([
        { id: 'document-1', title: 'Procuração', versions: [] },
      ]) as never,
    )
    useGenerateConsultationDocumentActionMock.mockReturnValue(
      createIndividualAction({ pendingDocumentIds: ['document-1'] }) as never,
    )
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue(
      cancellation as never,
    )

    const { result } = renderHook(() =>
      useConsultationDocumentsPage({ consultationId: 'consultation-1' }),
    )

    expect(result.current.documents[0]?.status).toBe('generating')

    await act(async () => {
      await result.current.handleCancelDocumentGeneration('document-1')
    })

    expect(result.current.documents[0]?.status).toBe('not_generated')
  })
})
