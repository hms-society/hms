import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormBooleanFieldConfiguration } from '../index'

describe('dynamic-form-boolean-field-configuration', () => {
  it('delegates the selected default and exposes pressed semantics', () => {
    const onDefaultValueChange = vi.fn()
    render(
      <DynamicFormBooleanFieldConfiguration
        fieldClientId='field-1'
        defaultValue={true}
        isDisabled={false}
        onDefaultValueChange={onDefaultValueChange}
      />,
    )
    expect(screen.getByRole('button', { name: 'Sim' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Não' }))
    expect(onDefaultValueChange).toHaveBeenCalledWith(false)
  })
})
