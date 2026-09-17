import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormFieldList } from '../index'

describe('dynamic-form-field-list', () => {
  it('renders the empty state and delegates adding a field', () => {
    const onEdit = vi.fn()
    render(
      <DynamicFormFieldList
        fields={[]}
        onEdit={onEdit}
        onRemove={vi.fn()}
        onMove={vi.fn()}
      />,
    )
    expect(
      screen.getByText('Nenhum campo adicionado. Comece adicionando um campo.'),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar campo' }))
    expect(onEdit).toHaveBeenCalledWith('')
  })
})
