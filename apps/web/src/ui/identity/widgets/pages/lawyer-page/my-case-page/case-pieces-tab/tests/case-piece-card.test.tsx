import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CasePieceCard } from '../case-piece-card'

describe('CasePieceCard', () => {
  it.each([
    ['Aprovada', 'success'],
    ['Requer ajustes', 'attention'],
    ['Em revisão', 'info'],
    ['Falha na geração', 'destructive'],
    ['Em elaboração', 'secondary'],
  ])('uses the %s color for that status', (status, variant) => {
    render(
      <CasePieceCard
        piece={{
          id: 'piece-1',
          title: 'Petição inicial',
          template: 'Modelo universal',
          author: 'Advogado',
          reviewer: 'Revisor',
          updatedAt: '12:00',
          status,
          versions: [],
        }}
      />,
    )

    expect(screen.getByText(status).getAttribute('data-variant')).toBe(variant)
  })
})
