import { render, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormDateFieldConfiguration } from '../index'

describe('dynamic-form-date-field-configuration', () => {
  it('delegates date changes and links validation text to the input', () => {
    const onDefaultValueChange = vi.fn()
    render(
      <DynamicFormDateFieldConfiguration
        fieldClientId='field-1'
        defaultValue='2025-01-01'
        isDisabled={false}
        defaultValueError='Data inválida'
        onDefaultValueChange={onDefaultValueChange}
      />,
    )
    const input = document.getElementById('field-1-default') as HTMLInputElement
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('field-1-date-default-error')
    fireEvent.change(input, { target: { value: '2025-02-03' } })
    expect(onDefaultValueChange).toHaveBeenCalledWith('2025-02-03')
  })
})
