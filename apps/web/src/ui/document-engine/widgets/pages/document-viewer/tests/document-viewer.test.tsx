import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentViewerPage } from '../index'
import { useDocumentViewer } from '../use-document-viewer'

vi.mock('react-pdf', () => ({
  Document: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Page: () => <div />,
  pdfjs: { GlobalWorkerOptions: {} },
}))

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: 'worker.js',
}))

vi.mock('../use-document-viewer', () => ({
  useDocumentViewer: vi.fn(),
}))

const useDocumentViewerMock = vi.mocked(useDocumentViewer)

function createController(overrides: Partial<ReturnType<typeof useDocumentViewer>> = {}) {
  return {
    file: {
      id: 'file-123',
      originalName: 'documento.pdf',
      mimeType: 'application/pdf',
      storagePath: 'seed/documento.pdf',
      sizeBytes: 2048,
      createdAt: '2026-08-10T12:00:00.000Z',
    },
    fileUrl: 'blob:document',
    fileId: 'file-123',
    numPages: 0,
    setNumPages: vi.fn(),
    zoom: 1,
    pageWidth: 900,
    isDragging: false,
    canPan: false,
    viewerRef: { current: null },
    isLoadingFile: false,
    isErrorFile: false,
    isLoadingUrl: false,
    isErrorUrl: false,
    format: 'PDF',
    formattedDate: '10/08/2026 09:00',
    formattedFileSize: '2 KB',
    handleBack: vi.fn(),
    handleDownload: vi.fn(),
    handleZoomIn: vi.fn(),
    handleZoomOut: vi.fn(),
    handleMouseDown: vi.fn(),
    handleMouseMove: vi.fn(),
    handleMouseUp: vi.fn(),
    minZoom: 0.5,
    maxZoom: 2,
    ...overrides,
  } as ReturnType<typeof useDocumentViewer>
}

describe('DocumentViewerPage', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('renders the loading state while file metadata is loading', () => {
    useDocumentViewerMock.mockReturnValue(
      createController({ file: undefined, isLoadingFile: true }),
    )

    render(<DocumentViewerPage />)

    expect(screen.getByText('Carregando visualizador...')).toBeDefined()
  })

  it('renders the file metadata and download action', () => {
    const handleDownload = vi.fn()
    useDocumentViewerMock.mockReturnValue(createController({ handleDownload }))

    render(<DocumentViewerPage />)

    expect(screen.getByRole('heading', { name: 'Editor de validação' })).toBeDefined()
    expect(screen.getByText('documento.pdf')).toBeDefined()

    screen.getByRole('button', { name: 'Baixar arquivo' }).click()

    expect(handleDownload).toHaveBeenCalledTimes(1)
  })
})
