import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormSelectionFieldConfiguration } from '../index'

describe('dynamic-form-selection-field-configuration', () => {
  it('renders the selection mode and delegates option editor props', () => {
    render(
      <DynamicFormSelectionFieldConfiguration
        fieldClientId='field-1'
        mode='multiple_selection'
        options={[{ clientId: 'option-1', label: 'Contrato' }]}
        defaultOptionClientIds={['option-1']}
        isDisabled={false}
        optionErrors={[]}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByText('Escolha uma ou mais opções')).toBeTruthy()
    expect(
      (screen.getByRole('textbox', { name: 'Rótulo da opção 1' }) as HTMLInputElement)
        .value,
    ).toBe('Contrato')
  })
})
