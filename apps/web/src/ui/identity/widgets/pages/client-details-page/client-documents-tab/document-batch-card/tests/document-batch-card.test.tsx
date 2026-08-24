import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DocumentBatchCard } from '../index'

const navigateToMock = vi.fn()

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

const batch = {
  id: 'batch-1',
  readableId: 'LOTE-0001',
  channel: 'whatsapp',
  createdAt: '2026-08-10T12:00:00.000Z',
  files: [
    {
      id: 'file-1',
      originalName: 'documento.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
    },
  ],
}

describe('DocumentBatchCard', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('starts collapsed and expands the file list', () => {
    render(<DocumentBatchCard batch={batch} />)

    expect(
      screen.getByRole('button', { name: 'Expandir lote' }).getAttribute('aria-expanded'),
    ).toBe('false')
    expect(screen.queryByText('documento.pdf')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Expandir lote' }))

    expect(screen.getByText('documento.pdf')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Recolher lote' }).getAttribute('aria-expanded'),
    ).toBe('true')
  })

  it('navigates to the document analysis page for a file', () => {
    render(<DocumentBatchCard batch={batch} />)

    fireEvent.click(screen.getByRole('button', { name: 'Expandir lote' }))
    fireEvent.click(screen.getByRole('button', { name: 'Visualizar documento.pdf' }))

    expect(navigateToMock).toHaveBeenCalledWith('documentAnalysis', {
      params: { fileId: 'file-1' },
    })
  })

  it('renders the empty file state for a processed batch without files', () => {
    render(<DocumentBatchCard batch={{ ...batch, files: [] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Expandir lote' }))

    expect(screen.getByText('Nenhum arquivo processado neste lote.')).toBeTruthy()
  })
})
