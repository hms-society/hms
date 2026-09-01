import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DocumentFilePreviewProps } from '@/ui/document-engine/widgets/components/document-file-preview'

import { DocumentViewerPage } from '../index'
import { useDocumentViewer } from '../use-document-viewer'

vi.mock('@/ui/document-engine/widgets/components/document-file-preview', () => ({
  DocumentFilePreview: ({ documentFileId }: DocumentFilePreviewProps) => (
    <div data-testid='document-file-preview'>{documentFileId}</div>
  ),
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
    fileId: 'file-123',
    isLoadingFile: false,
    isErrorFile: false,
    format: 'PDF',
    formattedDate: '10/08/2026 09:00',
    formattedFileSize: '2 KB',
    backLabel: 'Voltar aos documentos',
    handleBack: vi.fn(),
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

  it('renders the file metadata and shared preview', () => {
    useDocumentViewerMock.mockReturnValue(createController())

    render(<DocumentViewerPage />)

    expect(screen.getByRole('heading', { name: 'Editor de validação' })).toBeDefined()
    expect(screen.getByText('documento.pdf')).toBeDefined()
    expect(screen.getByTestId('document-file-preview').textContent).toBe('file-123')
    expect(screen.queryByRole('button', { name: 'Baixar arquivo' })).toBeNull()
  })
})
