import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CasePieceCard } from '../case-piece-card'
import type { CasePiece } from '../types'

describe('CasePieceCard', () => {
  afterEach(cleanup)

  it('opens the technical review and editor destinations independently', () => {
    const onOpenReviewMock = vi.fn()
    const onOpenEditorMock = vi.fn()
    const piece: CasePiece = {
      id: 'piece-1',
      title: 'Requerimento administrativo',
      template: 'Modelo documental',
      author: 'Colaborador',
      reviewer: 'Revisor',
      updatedAt: 'hoje',
      status: 'Em revisão técnica',
      versions: [],
    }

    render(
      <CasePieceCard
        piece={piece}
        onOpenReview={onOpenReviewMock}
        onOpenEditor={onOpenEditorMock}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Abrir revisão técnica/i }))
    fireEvent.click(screen.getByRole('button', { name: /Abrir no editor/i }))

    expect(onOpenReviewMock).toHaveBeenCalledOnce()
    expect(onOpenEditorMock).toHaveBeenCalledOnce()
  })
})
