import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/ui/shared/hooks/use-rest-context', () => ({
  useRestContext: () => ({
    caseManagementService: {
      listCaseTasks: vi.fn().mockResolvedValue({ isFailure: false, body: [] }),
      createCaseTask: vi.fn(),
      updateCaseTask: vi.fn(),
    },
  }),
}))

import { TasksDeadlinesTab } from './index'
import { NewItemDialog } from './new-item-dialog'

describe('TasksDeadlinesTab', () => {
  it('renders an empty case task list without seeded items', () => {
    render(
      <TasksDeadlinesTab
        caseId='case-id'
        caseIdentifier='CASE-TEST'
        caseTitle='Caso de teste'
      />,
    )

    expect(screen.getByText('Prazos e tarefas')).toBeTruthy()
    expect(screen.getByText('Nenhum item cadastrado neste caso.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Novo item/ })).toBeTruthy()
  })

  it('opens the new item modal and creates a publication locally', () => {
    render(
      <TasksDeadlinesTab
        caseId='case-id'
        caseIdentifier='CASE-TEST'
        caseTitle='Caso de teste'
      />,
    )

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

  it('shows the validation message when Outro has no custom type', () => {
    render(
      <NewItemDialog
        caseIdentifier='CASE-TEST'
        caseTitle='Caso de teste'
        open
        onOpenChange={() => undefined}
        onCreate={() => undefined}
        team={[]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Outro/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Criar item' }))

    expect(
      screen.getByText('Preencha os campos obrigatórios para continuar.', {
        selector: '#custom-type-error',
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('textbox', { name: 'Nome do tipo' }).getAttribute('aria-invalid'),
    ).toBe('true')
  })
})
