import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PendingMarkersDialog } from '../pending-markers-dialog'
import { usePendingMarkersDialog } from '../pending-markers-dialog/use-pending-markers-dialog'

vi.mock('../pending-markers-dialog/use-pending-markers-dialog', () => ({
  usePendingMarkersDialog: vi.fn(),
}))
const usePendingMarkersDialogMock = vi.mocked(usePendingMarkersDialog)

describe('PendingMarkersDialog', () => {
  it('opens a labeled field and submits its value with the selected marker', () => {
    const onFill = vi.fn()
    const handleStartFilling = vi.fn()
    const handleSubmit = vi.fn((event) => event.preventDefault())
    usePendingMarkersDialogMock.mockReturnValue({
      editingMarker: '{cliente_nome}',
      value: 'Maria Silva',
      handleStartFilling,
      handleSubmit,
      handleOpenChange: vi.fn(),
      handleCancelFilling: vi.fn(),
      handleValueChange: vi.fn(),
      getPendingMarkerLabel: () => 'Nome do cliente',
    })
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
    expect(handleStartFilling).toHaveBeenCalledWith('{cliente_nome}')
    expect(input.getAttribute('value')).toBe('Maria Silva')
    fireEvent.change(input, { target: { value: 'Maria Silva' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar valor' }))
    expect(handleSubmit).toHaveBeenCalledOnce()
  })
})
