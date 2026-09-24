import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewPieceDialog } from '../new-piece-dialog'

describe('NewPieceDialog', () => {
  afterEach(cleanup)

  it('returns to the pieces list after the generation screen is completed', () => {
    const onOpenChangeMock = vi.fn()
    const onGeneratedMock = vi.fn()

    render(
      <NewPieceDialog
        open
        onOpenChange={onOpenChangeMock}
        onGenerated={onGeneratedMock}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }))
    fireEvent.click(screen.getByRole('button', { name: /Gerar minuta com IA/i }))
    expect(screen.getByText('Minuta gerada com sucesso')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para peças' }))

    expect(onOpenChangeMock).toHaveBeenCalledWith(false)
    expect(onGeneratedMock).toHaveBeenCalledOnce()
  })
})
