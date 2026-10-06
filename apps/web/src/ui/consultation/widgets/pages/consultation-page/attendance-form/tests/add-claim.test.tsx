import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AddClaimDialog } from '../add-claim'

describe('AddClaimDialog', () => {
  afterEach(cleanup)

  it('does not render while closed', () => {
    render(<AddClaimDialog isOpen={false} onClose={vi.fn()} onAdd={vi.fn()} />)

    expect(
      screen.queryByRole('heading', { name: 'Adicionar pedido jurídico' }),
    ).toBeNull()
  })

  it('shows a validation message and keeps the dialog open when the title is empty', () => {
    render(<AddClaimDialog isOpen onClose={vi.fn()} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pedido' }))

    expect(screen.getByText('O título do pedido é obrigatório.')).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Adicionar pedido jurídico' }),
    ).not.toBeNull()
  })

  it('adds a valid claim and closes the dialog', () => {
    const onAdd = vi.fn()
    const onClose = vi.fn()
    render(<AddClaimDialog isOpen onClose={onClose} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText('Título do pedido *'), {
      target: { value: '  Indenização por danos  ' },
    })
    fireEvent.change(screen.getByLabelText('Resumo/Fundamentação'), {
      target: { value: 'Fatos e fundamento legal.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pedido' }))

    expect(onAdd).toHaveBeenCalledWith({
      title: 'Indenização por danos',
      summary: 'Fatos e fundamento legal.',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('edits an existing claim while preserving its id and allows cancel to reset it', () => {
    const onAdd = vi.fn()
    const onClose = vi.fn()
    render(
      <AddClaimDialog
        isOpen
        onClose={onClose}
        onAdd={onAdd}
        claimToEdit={{
          id: 'claim-1',
          title: 'Pedido anterior',
          summary: 'Resumo anterior',
        }}
      />,
    )

    expect(screen.getByDisplayValue('Pedido anterior')).not.toBeNull()
    expect(screen.getByDisplayValue('Resumo anterior')).not.toBeNull()
    fireEvent.change(screen.getByLabelText('Título do pedido *'), {
      target: { value: 'Pedido atualizado' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onAdd).toHaveBeenCalledWith({
      id: 'claim-1',
      title: 'Pedido atualizado',
      summary: 'Resumo anterior',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes and clears validation feedback when cancelled', () => {
    const onClose = vi.fn()
    render(<AddClaimDialog isOpen onClose={onClose} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar pedido' }))
    expect(screen.getByText('O título do pedido é obrigatório.')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByText('O título do pedido é obrigatório.')).toBeNull()
  })
})
