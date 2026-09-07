import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDocumentFileQuery } from '@/ui/document-engine/hooks/use-document-file-query'
import { useDocumentFileUrlQuery } from '@/ui/document-engine/hooks/use-document-file-url-query'

import { DocumentFilePreview } from '..'

vi.mock('react-pdf', () => ({
  Document: ({ children }: { children: ReactNode }) => (
    <div data-testid='pdf-document'>{children}</div>
  ),
  Page: ({ pageNumber }: { pageNumber: number }) => (
    <div data-testid='pdf-page'>Página {pageNumber}</div>
  ),
  pdfjs: { GlobalWorkerOptions: {} },
}))

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: 'pdf-worker.js',
}))

vi.mock('@/ui/document-engine/hooks/use-document-file-query', () => ({
  useDocumentFileQuery: vi.fn(),
}))

vi.mock('@/ui/document-engine/hooks/use-document-file-url-query', () => ({
  useDocumentFileUrlQuery: vi.fn(),
}))

const useDocumentFileQueryMock = vi.mocked(useDocumentFileQuery)
const useDocumentFileUrlQueryMock = vi.mocked(useDocumentFileUrlQuery)

describe('DocumentFilePreview', () => {
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

  it('renders the PDF preview with zoom controls', () => {
    render(<DocumentFilePreview documentFileId='document-file-1' />)

    expect(useDocumentFileQueryMock).toHaveBeenCalledWith('document-file-1')
    expect(screen.getByTestId('pdf-document')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Ampliar zoom' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Reduzir zoom' })).toBeDefined()
  })

  it('keeps the download action hidden by default', () => {
    render(<DocumentFilePreview documentFileId='document-file-1' />)

    expect(screen.queryByRole('button', { name: 'Baixar arquivo' })).toBeNull()
  })
})
