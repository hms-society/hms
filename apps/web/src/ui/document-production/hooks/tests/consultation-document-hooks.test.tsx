import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@hms/core/shared/responses/rest-response'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from '../consultation-document-query-keys'
import { useConsultationDocumentVersionQuery } from '../use-consultation-document-version-query'
import { useConsultationDocumentsQuery } from '../use-consultation-documents-query'
import { useCancelConsultationDocumentGenerationAction } from '../use-cancel-consultation-document-generation-action'
import { useGenerateConsultationDocumentAction } from '../use-generate-consultation-document-action'
import { useGenerateConsultationDocumentsAction } from '../use-generate-consultation-documents-action'
import { useReviewConsultationDocumentVersionAction } from '../use-review-consultation-document-version-action'
import { useSaveManualConsultationDocumentVersionAction } from '../use-save-manual-consultation-document-version-action'
import { useSelectCurrentConsultationDocumentVersionAction } from '../use-select-current-consultation-document-version-action'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: vi.fn(),
}))

const useRestContextMock = vi.mocked(useRestContext)

describe('consultation document hooks', () => {
  const service = {
    listDocuments: vi.fn(),
    generateDocument: vi.fn(),
    generateDocuments: vi.fn(),
    cancelDocumentGeneration: vi.fn(),
    getDocumentVersion: vi.fn(),
    saveManualVersion: vi.fn(),
    reviewVersion: vi.fn(),
    selectCurrentVersion: vi.fn(),
  }

  const documentVersion = {
    id: 'version-1',
    documentId: 'document-1',
    fileId: 'file-1',
    versionNumber: 1,
    source: 'ai',
    content: { type: 'doc', content: [] },
    pendingMarkers: [],
    createdByCollaboratorId: 'collaborator-1',
    createdAt: new Date('2026-08-13T12:00:00.000Z'),
    status: 'in_review',
  } as const

  const document = {
    id: 'document-1',
    documentSpecificationId: 'specification-1',
    currentVersionId: 'version-1',
    createdAt: new Date('2026-08-13T12:00:00.000Z'),
    updatedAt: new Date('2026-08-13T12:00:00.000Z'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useRestContextMock.mockReturnValue({
      consultationDocumentProductionService: service,
    } as never)
  })

  function createWrapper(queryClient: QueryClient) {
    return function QueryProvider({ children }: PropsWithChildren) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
  }

  it('does not list documents without a consultation id', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useConsultationDocumentsQuery(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(service.listDocuments).not.toHaveBeenCalled()
  })

  it('lists documents with the complete consultation key', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    service.listDocuments.mockResolvedValue(new RestResponse({ body: [] }))

    renderHook(() => useConsultationDocumentsQuery('consultation-1'), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() =>
      expect(service.listDocuments).toHaveBeenCalledWith('consultation-1'),
    )
    expect(
      queryClient.getQueryData(consultationDocumentQueryKeys.list('consultation-1')),
    ).toEqual([])
  })

  it('starts an individual generation against the document and marks it optimistically', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(consultationDocumentQueryKeys.list('consultation-1'), [
      { id: 'document-1', title: 'Procuração', versions: [] },
    ])
    service.generateDocument.mockResolvedValue(
      new RestResponse({
        statusCode: 202,
        body: { documentGenerationId: 'generation-1', documentId: 'document-1' },
      }),
    )

    const { result } = renderHook(
      () => useGenerateConsultationDocumentAction('consultation-1'),
      { wrapper: createWrapper(queryClient) },
    )

    await act(async () => {
      await result.current.generateDocument({ documentId: 'document-1' })
    })

    expect(service.generateDocument).toHaveBeenCalledWith('consultation-1', 'document-1')
    expect(result.current.pendingDocumentIds).toEqual(['document-1'])
  })

  it('cancels a generation and invalidates the authoritative document list', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateQueriesMock = vi.spyOn(queryClient, 'invalidateQueries')
    service.cancelDocumentGeneration.mockResolvedValue(
      new RestResponse<void>({ statusCode: 204 }),
    )

    const { result } = renderHook(
      () => useCancelConsultationDocumentGenerationAction('consultation-1'),
      { wrapper: createWrapper(queryClient) },
    )

    await act(async () => {
      await result.current.cancelDocumentGeneration('document-1')
    })

    expect(service.cancelDocumentGeneration).toHaveBeenCalledWith(
      'consultation-1',
      'document-1',
    )
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: consultationDocumentQueryKeys.list('consultation-1'),
    })
  })

  it('clears the individual generation state after a conflict', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(consultationDocumentQueryKeys.list('consultation-1'), [
      { id: 'document-1', title: 'Procuração', versions: [] },
    ])
    service.generateDocument.mockResolvedValue(
      new RestResponse({ statusCode: 409, errorMessage: 'Already generating' }),
    )

    const { result } = renderHook(
      () => useGenerateConsultationDocumentAction('consultation-1'),
      { wrapper: createWrapper(queryClient) },
    )

    await act(async () => {
      await result.current.generateDocument({ documentId: 'document-1' })
    })

    await waitFor(() => expect(result.current.pendingDocumentIds).toEqual([]))
  })

  it('clears the batch generation state after a conflict', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(consultationDocumentQueryKeys.list('consultation-1'), [
      { id: 'document-1', title: 'Procuração', versions: [] },
    ])
    service.generateDocuments.mockResolvedValue(
      new RestResponse({ statusCode: 409, errorMessage: 'Already generating' }),
    )

    const { result } = renderHook(
      () => useGenerateConsultationDocumentsAction('consultation-1'),
      { wrapper: createWrapper(queryClient) },
    )

    await act(async () => {
      await result.current.generateDocuments()
    })

    await waitFor(() => expect(result.current.pendingDocumentIds).toEqual([]))
  })

  it('loads a version with all consultation, document, and version ids', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    service.getDocumentVersion.mockResolvedValue(
      new RestResponse({ body: documentVersion }),
    )

    const { result } = renderHook(
      () =>
        useConsultationDocumentVersionQuery('consultation-1', 'document-1', 'version-1'),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.documentVersion).toEqual(documentVersion))
    expect(service.getDocumentVersion).toHaveBeenCalledWith(
      'consultation-1',
      'document-1',
      'version-1',
    )
    expect(
      queryClient.getQueryData(
        consultationDocumentQueryKeys.version(
          'consultation-1',
          'document-1',
          'version-1',
        ),
      ),
    ).toEqual(documentVersion)
  })

  it('does not load a version until all ids are available', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    const { result } = renderHook(
      () => useConsultationDocumentVersionQuery('consultation-1', 'document-1'),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.isFetchingDocumentVersion).toBe(false))
    expect(service.getDocumentVersion).not.toHaveBeenCalled()
  })

  it('reviews a version with a strict decision body and invalidates list and detail', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateQueriesMock = vi.spyOn(queryClient, 'invalidateQueries')
    service.reviewVersion.mockResolvedValue(new RestResponse({ body: documentVersion }))

    const { result } = renderHook(() => useReviewConsultationDocumentVersionAction(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.reviewVersion({
        consultationId: 'consultation-1',
        documentId: 'document-1',
        documentVersionId: 'version-1',
        request: { decision: 'approved' },
      })
    })

    await waitFor(() => expect(result.current.isReviewVersionSuccess).toBe(true))
    expect(service.reviewVersion).toHaveBeenCalledWith(
      'consultation-1',
      'document-1',
      'version-1',
      { decision: 'approved' },
    )
    expect(result.current.reviewedVersion).toEqual(documentVersion)
    expect(result.current.isReviewVersionSuccess).toBe(true)
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: consultationDocumentQueryKeys.list('consultation-1'),
    })
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: consultationDocumentQueryKeys.version(
        'consultation-1',
        'document-1',
        'version-1',
      ),
    })
  })

  it('saves a manual draft with only content and exposes pending state', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    let resolveSave:
      | ((response: RestResponse<typeof documentVersion>) => void)
      | undefined
    service.saveManualVersion.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      }),
    )

    const { result } = renderHook(
      () => useSaveManualConsultationDocumentVersionAction(),
      {
        wrapper: createWrapper(queryClient),
      },
    )
    const draft = { type: 'doc', content: [] } as const
    let savePromise: Promise<unknown> | undefined

    act(() => {
      savePromise = result.current.saveManualVersion({
        consultationId: 'consultation-1',
        documentId: 'document-1',
        sourceDocumentVersionId: 'version-1',
        content: draft,
      })
    })

    await waitFor(() => expect(result.current.isSavingManualVersion).toBe(true))
    resolveSave?.(new RestResponse({ body: documentVersion }))
    await act(async () => {
      await savePromise
    })

    await waitFor(() => expect(result.current.isSaveManualVersionSuccess).toBe(true))
    expect(service.saveManualVersion).toHaveBeenCalledWith(
      'consultation-1',
      'document-1',
      'version-1',
      draft,
    )
    expect(result.current.savedManualVersion).toEqual(documentVersion)
    expect(result.current.isSaveManualVersionSuccess).toBe(true)
  })

  it('keeps the draft available to the caller after a manual save error', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    service.saveManualVersion.mockResolvedValue(
      new RestResponse({ statusCode: 500, errorMessage: 'Save failed' }),
    )
    const { result } = renderHook(
      () => useSaveManualConsultationDocumentVersionAction(),
      {
        wrapper: createWrapper(queryClient),
      },
    )
    const draft = { type: 'doc', content: [] } as const

    await expect(
      result.current.saveManualVersion({
        consultationId: 'consultation-1',
        documentId: 'document-1',
        sourceDocumentVersionId: 'version-1',
        content: draft,
      }),
    ).rejects.toThrow('Save failed')

    expect(draft).toEqual({ type: 'doc', content: [] })
    expect(result.current.savedManualVersion).toBeUndefined()
  })

  it('refreshes authoritative data after a review conflict without claiming success', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateQueriesMock = vi.spyOn(queryClient, 'invalidateQueries')
    service.reviewVersion.mockResolvedValue(
      new RestResponse({ statusCode: 409, errorMessage: 'Already reviewed' }),
    )

    const { result } = renderHook(() => useReviewConsultationDocumentVersionAction(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.reviewVersion({
        consultationId: 'consultation-1',
        documentId: 'document-1',
        documentVersionId: 'version-1',
        request: { decision: 'rejected', rejectionReason: 'Outdated' },
      })
    })

    await waitFor(() => expect(result.current.isReviewVersionConflict).toBe(true))
    expect(result.current.isReviewVersionConflict).toBe(true)
    expect(result.current.isReviewVersionSuccess).toBe(false)
    expect(result.current.reviewVersionError).toBeNull()
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(2)
  })

  it('selects the current version with complete ids and no request body', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    service.selectCurrentVersion.mockResolvedValue(new RestResponse({ body: document }))

    const { result } = renderHook(
      () => useSelectCurrentConsultationDocumentVersionAction(),
      { wrapper: createWrapper(queryClient) },
    )

    await act(async () => {
      await result.current.selectCurrentVersion({
        consultationId: 'consultation-1',
        documentId: 'document-1',
        documentVersionId: 'version-1',
      })
    })

    await waitFor(() => expect(result.current.isSelectCurrentVersionSuccess).toBe(true))
    expect(service.selectCurrentVersion).toHaveBeenCalledWith(
      'consultation-1',
      'document-1',
      'version-1',
    )
    expect(result.current.selectedCurrentDocument).toEqual(document)
    expect(result.current.isSelectCurrentVersionSuccess).toBe(true)
  })
})
