import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentValidationDocumentFaker } from '@hms/core/document-engine/domain/entities/fakers'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { useDocumentValidationDocumentsQuery } from '@/ui/document-engine/hooks/use-document-validation-documents-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useDocumentInbox } from '../use-document-inbox'

vi.mock('@/ui/document-engine/hooks/use-document-validation-documents-query', () => ({
  useDocumentValidationDocumentsQuery: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useDocumentValidationDocumentsQueryMock = vi.mocked(
  useDocumentValidationDocumentsQuery,
)
const useNavigationMock = vi.mocked(useNavigation)

describe('useDocumentInbox', () => {
  const navigateTo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentValidationDocumentsQueryMock.mockReturnValue({
      documents: [
        DocumentValidationDocumentFaker.fake({
          id: 'document-file-1',
          fileName: 'validado.pdf',
          status: DocumentValidationStatus.Valid,
          extractedFields: [{ label: 'Titular', value: 'Mariana Costa Silva' }],
        }),
        DocumentValidationDocumentFaker.fake({
          id: 'document-file-2',
          fileName: 'ilegivel.pdf',
          status: DocumentValidationStatus.Illegible,
          extractedFields: [{ label: 'Titular', value: 'Mariana Costa Silva' }],
        }),
      ],
      documentsError: null,
      isFetchingDocuments: false,
      refetchDocuments: vi.fn(),
    })
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  it('maps backend documents to the inbox view model', () => {
    const { result } = renderHook(() => useDocumentInbox())

    expect(result.current.totalItems).toBe(2)
    expect(result.current.paginatedData[0]).toMatchObject({
      fileName: 'validado.pdf',
      status: 'Validado',
      receivedFrom: 'Mariana Costa Silva',
    })
  })

  it('applies the selected status filter and resets pagination', () => {
    const { result } = renderHook(() => useDocumentInbox())

    act(() => result.current.setStatusFilter('Ilegível'))
    act(() => result.current.handleApplyFilters())

    expect(result.current.totalItems).toBe(1)
    expect(result.current.paginatedData[0].fileName).toBe('ilegivel.pdf')
  })

  it('navigates to the analysis page for a selected document', async () => {
    const { result } = renderHook(() => useDocumentInbox())

    await act(async () => {
      await result.current.handleAnalyze('document-file-1')
    })

    expect(navigateTo).toHaveBeenCalledWith('documentAnalysis', {
      params: { fileId: 'document-file-1' },
    })
  })
})
