import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { DocumentFilePreviewProps } from '@/ui/document-engine/widgets/components/document-file-preview'

import { PdfViewerPanel } from '..'

vi.mock('@/ui/document-engine/widgets/components/document-file-preview', () => ({
  DocumentFilePreview: ({ documentFileId }: DocumentFilePreviewProps) => (
    <div data-testid='document-file-preview'>{documentFileId}</div>
  ),
}))


describe('PdfViewerPanel', () => {
  it('renders the shared document preview and validation metadata', () => {
    render(
      <PdfViewerPanel
        documentFileId='document-file-1'
        fileSize='1 KB'
        integrity='Confirmada'
        duplicity='Nenhuma correspondência'
      />,
    )

    expect(screen.getByTestId('document-file-preview').textContent).toBe(
      'document-file-1',
    )
    expect(screen.getByText('Confirmada')).toBeDefined()
    expect(screen.getByText('Nenhuma correspondência')).toBeDefined()
  })
})
