import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CasePieceCard } from '../case-piece-card'
import type { CasePiece } from '../types'

const piece: CasePiece = {
  id: 'document-1',
  title: 'Requerimento administrativo',
  template: 'Modelo Universal',
  author: 'Solicitante atual',
  reviewer: '—',
  updatedAt: '—',
  status: 'Gerando minuta',
  versions: [],
}

describe('CasePieceCard', () => {
  afterEach(cleanup)

  it('offers retry for a stuck generation and invokes its handler', () => {
    const onRetry = vi.fn()
    render(<CasePieceCard piece={piece} onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Gerar novamente' }))

    expect(onRetry).toHaveBeenCalledOnce()
    expect(screen.getByText(/Se ela ficar parada/)).toBeTruthy()
  })

  it('disables the retry action while a retry request is being sent', () => {
    render(<CasePieceCard piece={piece} isRetrying onRetry={vi.fn()} />)

    const button = screen.getByRole('button', { name: 'Enviando...' })
    expect(button).toHaveProperty('disabled', true)
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.querySelector('svg')?.classList.contains('animate-spin')).toBe(true)
  })
})
