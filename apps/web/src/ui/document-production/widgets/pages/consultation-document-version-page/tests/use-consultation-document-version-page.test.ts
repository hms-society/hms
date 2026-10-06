import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConsultationFaker } from '@hms/core/consultation/domain/entities/fakers'
import {
  DocumentFaker,
  DocumentVersionFaker,
} from '@hms/core/document-production/domain/entities/fakers'
import { DocumentVersionStatus } from '@hms/core/document-production/domain/structures'
import { useConsultationQuery } from '@/ui/consultation/hooks/use-consultation-query'
import { useConsultationDocumentsQuery } from '@/ui/document-production/hooks/use-consultation-documents-query'
import { useConsultationDocumentVersionQuery } from '@/ui/document-production/hooks/use-consultation-document-version-query'
import { useReviewConsultationDocumentVersionAction } from '@/ui/document-production/hooks/use-review-consultation-document-version-action'
import { useConsultationDocumentVersionPage } from '../use-consultation-document-version-page'

vi.mock('@/ui/consultation/hooks/use-consultation-query', () => ({
  useConsultationQuery: vi.fn(),
}))

vi.mock('@/ui/document-production/hooks/use-consultation-documents-query', () => ({
  useConsultationDocumentsQuery: vi.fn(),
}))

vi.mock('@/ui/document-production/hooks/use-consultation-document-version-query', () => ({
  useConsultationDocumentVersionQuery: vi.fn(),
}))

vi.mock(
  '@/ui/document-production/hooks/use-review-consultation-document-version-action',
  () => ({
    useReviewConsultationDocumentVersionAction: vi.fn(),
  }),
)

const useConsultationQueryMock = vi.mocked(useConsultationQuery)
const useConsultationDocumentsQueryMock = vi.mocked(useConsultationDocumentsQuery)
const useConsultationDocumentVersionQueryMock = vi.mocked(
  useConsultationDocumentVersionQuery,
)
const useReviewConsultationDocumentVersionActionMock = vi.mocked(
  useReviewConsultationDocumentVersionAction,
)
const reviewVersionMock = vi.fn().mockResolvedValue(undefined)

const hookProps = {
  consultationId: 'consultation-1',
  documentId: 'document-1',
  documentVersionId: 'version-1',
}

const version = DocumentVersionFaker.fake({
  id: 'version-1',
  documentId: 'document-1',
  status: DocumentVersionStatus.InReview,
})

describe('useConsultationDocumentVersionPage', () => {
  afterEach(() => vi.clearAllMocks())

  beforeEach(() => {
    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: version,
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn(),
    })
    useConsultationDocumentsQueryMock.mockReturnValue({
      data: [DocumentFaker.fake({ id: 'document-1', title: 'Procuração' })],
    } as unknown as ReturnType<typeof useConsultationDocumentsQuery>)
    useConsultationQueryMock.mockReturnValue({
      consultation: ConsultationFaker.fake({ id: 'consultation-1', status: 'pending' }),
      isLoading: false,
      isError: false,
      error: null,
      responsible: undefined,
    })
    useReviewConsultationDocumentVersionActionMock.mockReturnValue({
      reviewVersion: reviewVersionMock,
      reviewedVersion: undefined,
      reviewVersionError: null,
      isReviewingVersion: false,
      isReviewVersionSuccess: false,
      isReviewVersionConflict: false,
    })
  })

  it('derives the document, reviewability, loading, and error state', () => {
    const { result, rerender } = renderHook(() =>
      useConsultationDocumentVersionPage(hookProps),
    )

    expect(useConsultationDocumentVersionQueryMock).toHaveBeenCalledWith(
      hookProps.consultationId,
      hookProps.documentId,
      hookProps.documentVersionId,
    )
    expect(useConsultationDocumentsQueryMock).toHaveBeenCalledWith(
      hookProps.consultationId,
    )
    expect(useConsultationQueryMock).toHaveBeenCalledWith(hookProps.consultationId)
    expect(result.current.document?.title).toBe('Procuração')
    expect(result.current.version).toBe(version)
    expect(result.current.isReviewable).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)

    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: undefined,
      documentVersionError: new Error('Version unavailable'),
      isLoadingDocumentVersion: true,
      isFetchingDocumentVersion: true,
      isSuccess: false,
      refetch: vi.fn(),
    })
    rerender()

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(true)
    expect(result.current.isReviewable).toBe(false)

    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: undefined,
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: false,
      refetch: vi.fn(),
    })
    useConsultationDocumentsQueryMock.mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useConsultationDocumentsQuery>)
    rerender()

    expect(result.current.document).toBeUndefined()
    expect(result.current.version).toBeUndefined()
    expect(result.current.isError).toBe(false)
    expect(result.current.isReviewable).toBe(false)
  })

  it('allows review only while the version is in review and consultation is pending', () => {
    const { result, rerender } = renderHook(() =>
      useConsultationDocumentVersionPage(hookProps),
    )

    expect(result.current.isReviewable).toBe(true)

    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: DocumentVersionFaker.fake({
        id: 'version-1',
        documentId: 'document-1',
        status: DocumentVersionStatus.Approved,
      }),
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn(),
    })
    rerender()
    expect(result.current.isReviewable).toBe(false)

    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: version,
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn(),
    })
    useConsultationQueryMock.mockReturnValue({
      consultation: ConsultationFaker.fake({ id: 'consultation-1', status: 'completed' }),
      isLoading: false,
      isError: false,
      error: null,
      responsible: undefined,
    })
    rerender()
    expect(result.current.isReviewable).toBe(false)
  })

  it('approves only a reviewable version with the expected decision', async () => {
    const { result, rerender } = renderHook(() =>
      useConsultationDocumentVersionPage(hookProps),
    )

    await act(async () => result.current.handleApprove())

    expect(reviewVersionMock).toHaveBeenCalledWith({
      ...hookProps,
      request: { decision: DocumentVersionStatus.Approved },
    })

    useConsultationQueryMock.mockReturnValue({
      consultation: ConsultationFaker.fake({ id: 'consultation-1', status: 'completed' }),
      isLoading: false,
      isError: false,
      error: null,
      responsible: undefined,
    })
    rerender()
    expect(result.current.isReviewable).toBe(false)
    const callCount = reviewVersionMock.mock.calls.length
    await act(async () => result.current.handleApprove())

    expect(reviewVersionMock).toHaveBeenCalledTimes(callCount)
  })

  it('requires a non-empty reason and trims it before rejecting', async () => {
    const { result } = renderHook(() => useConsultationDocumentVersionPage(hookProps))

    act(() => result.current.handleOpenRejectDialog())
    expect(result.current.isRejectDialogOpen).toBe(true)
    act(() => result.current.setRejectionReason('   '))
    await act(async () => result.current.handleReject())
    expect(reviewVersionMock).not.toHaveBeenCalled()
    expect(result.current.isRejectDialogOpen).toBe(true)

    act(() => result.current.setRejectionReason('  Missing signature  '))
    await act(async () => result.current.handleReject())

    expect(reviewVersionMock).toHaveBeenCalledWith({
      ...hookProps,
      request: {
        decision: DocumentVersionStatus.Rejected,
        rejectionReason: 'Missing signature',
      },
    })
    expect(result.current.isRejectDialogOpen).toBe(false)
    expect(result.current.rejectionReason).toBe('')
  })

  it('clears an old reason when the rejection dialog is opened again or closed', () => {
    const { result } = renderHook(() => useConsultationDocumentVersionPage(hookProps))

    act(() => result.current.setRejectionReason('Please revise this section'))
    act(() => result.current.handleOpenRejectDialog())

    expect(result.current.isRejectDialogOpen).toBe(true)
    expect(result.current.rejectionReason).toBe('')

    act(() => result.current.setRejectionReason('Please revise this section'))
    act(() => result.current.handleRejectDialogOpenChange(false))

    expect(result.current.isRejectDialogOpen).toBe(false)
    expect(result.current.rejectionReason).toBe('')
  })

  it('keeps the rejection dialog and reason available when the review request fails', async () => {
    reviewVersionMock.mockRejectedValueOnce(new Error('Review request failed'))
    const { result } = renderHook(() => useConsultationDocumentVersionPage(hookProps))

    act(() => result.current.handleOpenRejectDialog())
    act(() => result.current.setRejectionReason('  Missing signature  '))

    await expect(act(async () => result.current.handleReject())).rejects.toThrow(
      'Review request failed',
    )

    expect(result.current.isRejectDialogOpen).toBe(true)
    expect(result.current.rejectionReason).toBe('  Missing signature  ')
    expect(reviewVersionMock).toHaveBeenCalledWith({
      ...hookProps,
      request: {
        decision: DocumentVersionStatus.Rejected,
        rejectionReason: 'Missing signature',
      },
    })
  })

  it('does not submit a rejection when the version cannot be reviewed', async () => {
    useConsultationQueryMock.mockReturnValue({
      consultation: ConsultationFaker.fake({ id: 'consultation-1', status: 'completed' }),
      isLoading: false,
      isError: false,
      error: null,
      responsible: undefined,
    })
    const { result } = renderHook(() => useConsultationDocumentVersionPage(hookProps))

    act(() => result.current.setRejectionReason('Missing signature'))
    await act(async () => result.current.handleApprove())
    await act(async () => result.current.handleReject())

    expect(reviewVersionMock).not.toHaveBeenCalled()
  })
})
