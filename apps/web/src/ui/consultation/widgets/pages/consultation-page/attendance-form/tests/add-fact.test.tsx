import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AddFactDialog } from '../add-fact'

describe('AddFactDialog', () => {
  afterEach(cleanup)

  it('does not render while closed', () => {
    render(<AddFactDialog isOpen={false} onClose={vi.fn()} onAdd={vi.fn()} />)

    expect(screen.queryByRole('heading', { name: 'Adicionar fato' })).toBeNull()
  })

  it('validates a missing description without submitting', () => {
    render(<AddFactDialog isOpen onClose={vi.fn()} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar fato' }))

    expect(screen.getByText('A descrição do fato é obrigatória')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Adicionar fato' })).not.toBeNull()
  })

  it('formats a specific date and saves a new fact with its selected status', () => {
    const onAdd = vi.fn()
    const onClose = vi.fn()
    const { container } = render(<AddFactDialog isOpen onClose={onClose} onAdd={onAdd} />)

    const specificDateInput = container.querySelector('input[type="date"]')
    expect(specificDateInput).not.toBeNull()
    fireEvent.change(specificDateInput as HTMLInputElement, {
      target: { value: '2025-03-17' },
    })
    fireEvent.change(screen.getByLabelText('Descrição do fato *'), {
      target: { value: 'O vínculo de trabalho foi encerrado.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Controvertido' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar fato' }))

    expect(onAdd).toHaveBeenCalledWith({
      id: undefined,
      date: '17/03/2025',
      description: 'O vínculo de trabalho foi encerrado.',
      status: 'Controvertido',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('saves an undefined date as Indefinida', () => {
    const onAdd = vi.fn()
    render(<AddFactDialog isOpen onClose={vi.fn()} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole('button', { name: 'Indefinida' }))
    expect(screen.queryByPlaceholderText('2020–2026')).toBeNull()
    fireEvent.change(screen.getByLabelText('Descrição do fato *'), {
      target: { value: 'A data exata não foi informada.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar fato' }))

    expect(onAdd).toHaveBeenCalledWith({
      id: undefined,
      date: 'Indefinida',
      description: 'A data exata não foi informada.',
      status: 'A comprovar',
    })
  })

  it('saves a period and loads existing facts for editing', () => {
    const onAdd = vi.fn()
    const onClose = vi.fn()
    render(
      <AddFactDialog
        isOpen
        onClose={onClose}
        onAdd={onAdd}
        factToEdit={{
          id: 'fact-period',
          date: '2020–2024',
          description: 'Descrição original',
          status: 'Comprovado',
        }}
      />,
    )

    expect(screen.getByDisplayValue('2020–2024')).not.toBeNull()
    expect(screen.getByDisplayValue('Descrição original')).not.toBeNull()
    fireEvent.change(screen.getByLabelText('Descrição do fato *'), {
      target: { value: 'Descrição revisada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onAdd).toHaveBeenCalledWith({
      id: 'fact-period',
      date: '2020–2024',
      description: 'Descrição revisada',
      status: 'Comprovado',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('restores an indefinite edit and closes through the cancel action', () => {
    const onClose = vi.fn()
    render(
      <AddFactDialog
        isOpen
        onClose={onClose}
        onAdd={vi.fn()}
        factToEdit={{
          id: 'fact-undefined',
          date: 'Indefinida',
          description: 'Data incerta',
          status: 'A comprovar',
        }}
      />,
    )

    expect(screen.getByDisplayValue('Data incerta')).not.toBeNull()
    expect(screen.queryByPlaceholderText('2020–2026')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
