import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PendingMarkersDialog } from '../pending-markers-dialog'

describe('PendingMarkersDialog', () => {
  it('opens a labeled field and submits its value with the selected marker', () => {
    const onFill = vi.fn()
    render(
      <PendingMarkersDialog
        open
        markers={[{ marker: '{cliente_nome}' }]}
        isRemoving={false}
        onOpenChange={vi.fn()}
        onLocate={vi.fn()}
        onRemove={vi.fn()}
        onRemoveAll={vi.fn()}
        onFill={onFill}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Preencher' }))
    const input = screen.getByRole('textbox', { name: 'Nome do cliente' })
    expect(
      (screen.getByRole('button', { name: 'Salvar valor' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    fireEvent.change(input, { target: { value: 'Maria Silva' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar valor' }))
    expect(onFill).toHaveBeenCalledWith('{cliente_nome}', 'Maria Silva')
  })
})
