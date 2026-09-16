import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDynamicFormNumericFieldConfiguration } from '../use-dynamic-form-numeric-field-configuration'

describe('use-dynamic-form-numeric-field-configuration', () => {
  it('exposes currency metadata without an incompatible minimum rule', () => {
    const { result } = renderHook(() =>
      useDynamicFormNumericFieldConfiguration({
        fieldClientId: 'field-1',
        type: 'currency',
        defaultValue: 10.5,
        currency: 'BRL',
        isDisabled: false,
        errors: {},
        onDefaultValueChange: () => undefined,
        onValidationChange: () => undefined,
      }),
    )
    expect(result.current.currencyLabel).toBe('BRL')
    expect(result.current.showMinimum).toBe(false)
  })

  it('exposes the minimum rule only for integer fields', () => {
    const { result } = renderHook(() =>
      useDynamicFormNumericFieldConfiguration({
        fieldClientId: 'field-1',
        type: 'integer',
        isDisabled: false,
        errors: {},
        onDefaultValueChange: () => undefined,
        onValidationChange: () => undefined,
      }),
    )

    expect(result.current.showMinimum).toBe(true)
  })
})
