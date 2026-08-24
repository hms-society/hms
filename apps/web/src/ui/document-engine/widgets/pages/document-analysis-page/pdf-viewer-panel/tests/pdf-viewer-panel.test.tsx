import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PdfViewerPanel } from '..'

describe('PdfViewerPanel', () => {
  it('delegates opening the full document viewer', () => {
    const onOpenDocument = vi.fn()

    render(
      <PdfViewerPanel
        fileSize='1 KB'
        integrity='Confirmada'
        duplicity='Nenhuma correspondência'
        onOpenDocument={onOpenDocument}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Abrir visualizador' }))

    expect(onOpenDocument).toHaveBeenCalledOnce()
  })
})
