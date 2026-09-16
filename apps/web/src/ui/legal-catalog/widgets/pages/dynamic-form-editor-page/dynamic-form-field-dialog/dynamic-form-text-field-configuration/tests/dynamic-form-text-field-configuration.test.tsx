import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormTextFieldConfiguration } from '../index'

describe('dynamic-form-text-field-configuration', () => {
  it('uses a textarea for long text and delegates placeholder changes', () => {
    const onPlaceholderChange = vi.fn()
    render(
      <DynamicFormTextFieldConfiguration
        fieldClientId='field-1'
        type='long_text'
        placeholder='Detalhes'
        defaultValue='Texto'
        isDisabled={false}
        onPlaceholderChange={onPlaceholderChange}
        onDefaultValueChange={vi.fn()}
      />,
    )
    expect(
      (document.getElementById('field-1-default') as HTMLTextAreaElement).value,
    ).toBe('Texto')
    const placeholder = screen.getByLabelText('Placeholder')
    fireEvent.change(placeholder, { target: { value: 'Resumo' } })
    expect(onPlaceholderChange).toHaveBeenCalledWith('Resumo')
  })
})
