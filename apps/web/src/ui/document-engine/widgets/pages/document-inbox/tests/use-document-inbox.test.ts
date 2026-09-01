import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DocumentBatchChannel,
  DocumentBatchStatus,
} from '@hms/core/document-engine/domain/structures'
import { useDocumentBatchesTriageQuery } from '@/ui/document-engine/hooks/use-document-batches-triage-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useDocumentInbox } from '../use-document-inbox'

vi.mock('@/ui/document-engine/hooks/use-document-batches-triage-query', () => ({
  useDocumentBatchesTriageQuery: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useDocumentBatchesTriageQueryMock = vi.mocked(useDocumentBatchesTriageQuery)
const useNavigationMock = vi.mocked(useNavigation)

describe('useDocumentInbox', () => {
  const navigateTo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentBatchesTriageQueryMock.mockReturnValue({
      batches: [
        {
          id: 'batch-1',
          readableId: 'LOTE-20260826-0001',
          status: DocumentBatchStatus.PendingIdentification,
          channel: DocumentBatchChannel.WhatsApp,
          sender: '5511999998888',
          inTriageBox: true,
          clientId: 'client-1',
          files: [
            {
              id: 'file-1',
              batchId: 'batch-1',
              originalName: 'cnh.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 102400,
              storagePath: 'batches/cnh.pdf',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 6,
      batchesError: null,
      isFetchingBatches: false,
      refetchBatches: vi.fn(),
    })
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  it('maps triage document batches to the inbox view model', () => {
    const { result } = renderHook(() => useDocumentInbox())

    expect(useDocumentBatchesTriageQueryMock).toHaveBeenCalledWith({
      page: 1,
      limit: 6,
    })
    expect(result.current.totalItems).toBe(1)
    expect(result.current.paginatedData[0]).toMatchObject({
      fileName: 'cnh.pdf',
      status: 'Aguardando validação',
      receivedFrom: '5511999998888',
    })
  })

  it('navigates to the analysis page for a selected document', async () => {
    const { result } = renderHook(() => useDocumentInbox())

    await act(async () => {
      await result.current.handleAnalyze('file-1')
    })

    expect(navigateTo).toHaveBeenCalledWith('documentAnalysis', {
      params: { fileId: 'file-1' },
    })
  })

  it('keeps accepting a case id without changing the triage query contract', () => {
    renderHook(() => useDocumentInbox({ caseId: 'case-1' }))

    expect(useDocumentBatchesTriageQueryMock).toHaveBeenCalledWith({
      page: 1,
      limit: 6,
    })
  })
})
