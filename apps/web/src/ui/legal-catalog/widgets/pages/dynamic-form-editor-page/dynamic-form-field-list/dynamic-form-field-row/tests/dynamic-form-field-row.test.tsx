import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormFieldRow } from '../index'

vi.mock('@dnd-kit/sortable', async () => {
  const actual =
    await vi.importActual<typeof import('@dnd-kit/sortable')>('@dnd-kit/sortable')
  return {
    ...actual,
    useSortable: vi.fn(() => ({
      attributes: { role: 'button', tabIndex: 0 },
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    })),
  }
})

describe('dynamic-form-field-row', () => {
  it('delegates edit, remove and move actions from accessible controls', () => {
    const onEdit = vi.fn()
    const onRemove = vi.fn()
    const onMove = vi.fn()
    render(
      <DynamicFormFieldRow
        field={{
          clientId: 'field-1',
          label: 'Contrato',
          type: 'short_text',
          required: true,
        }}
        index={0}
        count={2}
        onEdit={onEdit}
        onRemove={onRemove}
        onMove={onMove}
      />,
    )
    expect(
      screen
        .getByRole('button', { name: 'Reordenar campo Contrato' })
        .getAttribute('aria-roledescription'),
    ).toBe('controle de reordenação')
    fireEvent.click(screen.getByRole('button', { name: 'Editar campo Contrato' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover campo Contrato' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mover Contrato para baixo' }))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onRemove).toHaveBeenCalledOnce()
    expect(onMove).toHaveBeenCalledWith(1)
  })

  it('does not expose the persisted form key', () => {
    render(
      <DynamicFormFieldRow
        field={{
          clientId: 'field-1',
          key: 'claim_value',
          label: 'Valor econômico aproximado',
          type: 'currency',
          required: false,
        }}
        index={0}
        count={1}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
        onMove={vi.fn()}
      />,
    )

    expect(screen.queryByText('Chave: claim_value')).toBeNull()
  })
})
