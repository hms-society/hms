import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormFieldDialog } from '../index'

vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserver {
    disconnect() {}
    observe() {}
    unobserve() {}
  },
)

describe('dynamic-form-field-dialog', () => {
  it.each([
    'consultation',
    'formalization',
  ] as const)('enables every field type for a %s form', (stage) => {
    render(
      <DynamicFormFieldDialog
        open
        mode='create'
        stage={stage}
        legalAreaName='Cível'
        legalTopicNames={['Contratos']}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    for (const name of [
      'Texto curto',
      'Texto longo',
      'Data',
      'Sim/Não',
      'Múltipla escolha',
      'Seleção única',
      'Número inteiro',
      'Moeda',
      'Percentual',
    ]) {
      expect(screen.getByRole('button', { name }).hasAttribute('disabled')).toBe(false)
    }
  })

  it('keeps invalid local fields in the dialog and exposes the error', () => {
    const onSubmit = vi.fn()
    render(
      <DynamicFormFieldDialog
        open
        mode='create'
        stage='consultation'
        legalAreaName='Cível'
        legalTopicNames={['Contratos']}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Salvar campo' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toContain(
      'O rótulo do campo é obrigatório.',
    )
  })
})
