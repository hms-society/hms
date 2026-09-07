import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDocumentFileQuery } from '@/ui/document-engine/hooks/use-document-file-query'
import { useDocumentFileUrlQuery } from '@/ui/document-engine/hooks/use-document-file-url-query'

import { useDocumentFilePreview } from '../use-document-file-preview'

vi.mock('@/ui/document-engine/hooks/use-document-file-query', () => ({
  useDocumentFileQuery: vi.fn(),
}))

vi.mock('@/ui/document-engine/hooks/use-document-file-url-query', () => ({
  useDocumentFileUrlQuery: vi.fn(),
}))

const useDocumentFileQueryMock = vi.mocked(useDocumentFileQuery)
const useDocumentFileUrlQueryMock = vi.mocked(useDocumentFileUrlQuery)

describe('useDocumentFilePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentFileQueryMock.mockReturnValue({
      file: {
        id: 'document-file-1',
        batchId: 'batch-1',
        originalName: 'documento.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storagePath: 'seed/documento.pdf',
        createdAt: new Date('2026-08-29T12:00:00.000Z'),
      },
      fileError: null,
      isLoadingFile: false,
      isErrorFile: false,
    })
    useDocumentFileUrlQueryMock.mockReturnValue({
      fileUrl: 'blob:documento',
      fileUrlError: null,
      isLoadingFileUrl: false,
      isErrorFileUrl: false,
    })
  })

  it('exposes file preview state from the document file id', () => {
    const { result } = renderHook(() => useDocumentFilePreview('document-file-1'))

    expect(useDocumentFileQueryMock).toHaveBeenCalledWith('document-file-1')
    expect(result.current.file?.originalName).toBe('documento.pdf')
    expect(result.current.format).toBe('PDF')
  })

  it('changes zoom within the configured limits', () => {
    const { result } = renderHook(() => useDocumentFilePreview('document-file-1'))

    act(() => {
      result.current.handleZoomIn()
    })
    expect(result.current.zoom).toBe(1.25)

    act(() => {
      for (let index = 0; index < 10; index++) result.current.handleZoomIn()
    })
    expect(result.current.zoom).toBe(2)

    act(() => {
      for (let index = 0; index < 10; index++) result.current.handleZoomOut()
    })
    expect(result.current.zoom).toBe(0.5)
  })
})
