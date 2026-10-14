import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDocumentFileQuery } from '@/ui/document-engine/hooks/use-document-file-query'
import { useDocumentFileUrlQuery } from '@/ui/document-engine/hooks/use-document-file-url-query'

import { DocumentFilePreview } from '..'

vi.mock('react-pdf', () => ({
  Document: ({
    children,
    error,
    loading,
  }: {
    children: ReactNode
    error: ReactNode
    loading: ReactNode
  }) => (
    <div data-testid='pdf-document'>
      {children}
      <div data-testid='pdf-document-error'>{error}</div>
      <div data-testid='pdf-document-loading'>{loading}</div>
    </div>
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

  it('centers PDF loading and error states in the viewer', () => {
    render(<DocumentFilePreview documentFileId='document-file-1' />)

    const pdfDocument = screen
      .getAllByTestId('pdf-document')
      .find((element) =>
        element
          .querySelector('[data-testid="pdf-document-error"]')
          ?.textContent?.includes('Não foi possível renderizar o PDF.'),
      )
    expect(pdfDocument).toBeDefined()
    const pdfLoadingState = pdfDocument?.querySelector(
      '[data-testid="pdf-document-loading"]',
    )
    const pdfErrorState = pdfDocument?.querySelector('[data-testid="pdf-document-error"]')

    expect(pdfLoadingState?.textContent).toContain('Renderizando PDF...')
    expect(pdfLoadingState?.firstElementChild?.classList.contains('absolute')).toBe(true)
    expect(pdfLoadingState?.firstElementChild?.classList.contains('inset-0')).toBe(true)
    expect(pdfLoadingState?.firstElementChild?.classList.contains('items-center')).toBe(
      true,
    )
    expect(pdfLoadingState?.firstElementChild?.classList.contains('justify-center')).toBe(
      true,
    )
    expect(pdfErrorState?.textContent).toContain('Não foi possível renderizar o PDF.')
    expect(pdfErrorState?.firstElementChild?.classList.contains('absolute')).toBe(true)
    expect(pdfErrorState?.firstElementChild?.classList.contains('inset-0')).toBe(true)
    expect(pdfErrorState?.firstElementChild?.classList.contains('items-center')).toBe(
      true,
    )
    expect(pdfErrorState?.firstElementChild?.classList.contains('justify-center')).toBe(
      true,
    )
  })
})
