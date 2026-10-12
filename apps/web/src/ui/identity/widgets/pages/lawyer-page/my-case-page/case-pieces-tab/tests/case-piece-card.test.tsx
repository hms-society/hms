import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CasePieceCard } from '../case-piece-card'
import type { CasePiece } from '../types'

const piece: CasePiece = {
  id: 'piece-1',
  title: 'Petição inicial',
  template: 'Auxílio-acidente',
  author: 'Solicitante atual',
  reviewer: '—',
  updatedAt: '—',
  status: 'Gerando minuta',
  versions: [],
}

describe('CasePieceCard', () => {
  it('shows a spinning icon while the draft is being generated', () => {
    render(<CasePieceCard piece={piece} />)

    const status = screen.getByText('Gerando minuta')
    expect(status.parentElement?.querySelector('.animate-spin')).not.toBeNull()
  })
})
