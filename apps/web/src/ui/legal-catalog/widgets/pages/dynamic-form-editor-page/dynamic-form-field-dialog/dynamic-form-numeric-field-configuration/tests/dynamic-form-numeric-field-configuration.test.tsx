import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormNumericFieldConfiguration } from '../index'

describe('dynamic-form-numeric-field-configuration', () => {
  it('delegates numeric defaults and precision changes with error IDs', () => {
    const onDefaultValueChange = vi.fn()
    const onValidationChange = vi.fn()
    render(
      <DynamicFormNumericFieldConfiguration
        fieldClientId='field-1'
        type='percentage'
        defaultValue={12.345}
        validation={{ scale: 2 }}
        isDisabled={false}
        errors={{ defaultValue: 'Precisão inválida', scale: 'Escala inválida' }}
        onDefaultValueChange={onDefaultValueChange}
        onValidationChange={onValidationChange}
      />,
    )
    const defaultInput = screen.getByRole('spinbutton', { name: 'Valor padrão' })
    const scaleInput = screen.getByRole('spinbutton', { name: 'Casas decimais' })
    expect(screen.queryByRole('spinbutton', { name: 'Valor mínimo' })).toBeNull()
    expect(defaultInput.getAttribute('aria-describedby')).toBe(
      'field-1-numeric-default-error',
    )
    expect(scaleInput.getAttribute('aria-describedby')).toBe(
      'field-1-numeric-scale-error',
    )
    fireEvent.change(defaultInput, { target: { value: '10.5' } })
    fireEvent.change(scaleInput, { target: { value: '3' } })
    expect(onDefaultValueChange).toHaveBeenCalledWith(10.5)
    expect(onValidationChange).toHaveBeenCalledWith({ scale: 3 })
  })

  it('renders BRL currency without a server-rejected minimum rule', () => {
    render(
      <DynamicFormNumericFieldConfiguration
        fieldClientId='currency-1'
        type='currency'
        defaultValue={1250.5}
        currency='BRL'
        validation={{ min: 1000 }}
        isDisabled={false}
        errors={{}}
        onDefaultValueChange={vi.fn()}
        onValidationChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('spinbutton', { name: 'Valor mínimo' })).toBeNull()
    expect(
      (screen.getByRole('textbox', { name: 'Moeda' }) as HTMLInputElement).value,
    ).toBe('Real brasileiro (BRL)')
  })
})
