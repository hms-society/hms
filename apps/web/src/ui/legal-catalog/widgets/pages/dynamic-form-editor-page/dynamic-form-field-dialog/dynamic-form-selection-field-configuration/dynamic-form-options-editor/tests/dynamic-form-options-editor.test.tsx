import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { DynamicFormEditorOption } from '../../../../types'
import { DynamicFormOptionsEditor } from '../index'

describe('dynamic-form-options-editor', () => {
  it('renders a sortable accessible handle and delegates option actions', () => {
    const onChange = vi.fn()
    render(
      <DynamicFormOptionsEditor
        mode='single_selection'
        options={[
          { clientId: 'option-1', label: 'Contrato' },
          { clientId: 'option-2', label: 'Trabalho' },
        ]}
        defaultOptionClientIds={[]}
        isDisabled={false}
        errors={[{ optionClientId: 'option-1', message: 'Rótulo inválido' }]}
        onChange={onChange}
      />,
    )
    const label = screen.getByRole('textbox', { name: 'Rótulo da opção 1' })
    expect(label.getAttribute('aria-invalid')).toBe('true')
    expect(label.getAttribute('aria-describedby')).toBe('option-1-error')
    const handle = screen.getByRole('button', { name: 'Reordenar opção 1' })
    expect(handle.getAttribute('aria-roledescription')).toBe('controle de reordenação')
    expect(handle.getAttribute('aria-keyshortcuts')).toBe('Space ArrowUp ArrowDown')
    fireEvent.click(screen.getByRole('button', { name: 'Usar opção 1 como padrão' }))
    expect(onChange).toHaveBeenCalledWith({
      options: [
        { clientId: 'option-1', label: 'Contrato' },
        { clientId: 'option-2', label: 'Trabalho' },
      ],
      defaultOptionClientIds: ['option-1'],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Mover opção 1 para baixo' }))
    expect(
      onChange.mock.lastCall?.[0].options.map(
        (option: DynamicFormEditorOption) => option.clientId,
      ),
    ).toEqual(['option-2', 'option-1'])
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar opção' }))
    expect(onChange.mock.lastCall?.[0].options).toHaveLength(3)
  })
})
