import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TasksDeadlinesTab } from './index'

describe('TasksDeadlinesTab', () => {
  it('renders an empty case task list without seeded items', () => {
    render(<TasksDeadlinesTab />)

    expect(screen.getByText('Prazos e tarefas')).toBeTruthy()
    expect(screen.getByText('Nenhum item cadastrado neste caso.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Novo item/ })).toBeTruthy()
  })

  it('opens the new item modal and creates a publication locally', () => {
    render(<TasksDeadlinesTab />)

    fireEvent.click(screen.getAllByRole('button', { name: /Novo item/ })[0])
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Nova tarefa ou prazo')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Publicação/ }))
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Acompanhar publicação no DOU' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Data prevista' }))
    expect(screen.getByRole('grid')).toBeTruthy()
  })
})
