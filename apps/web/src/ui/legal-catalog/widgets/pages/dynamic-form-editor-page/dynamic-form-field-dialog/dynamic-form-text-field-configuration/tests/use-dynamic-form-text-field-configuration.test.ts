import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDynamicFormTextFieldConfiguration } from '../use-dynamic-form-text-field-configuration'

describe('use-dynamic-form-text-field-configuration', () => {
  it('identifies long text fields for textarea rendering', () => {
    const { result } = renderHook(() =>
      useDynamicFormTextFieldConfiguration({
        fieldClientId: 'field-1',
        type: 'long_text',
        placeholder: 'Detalhes',
        defaultValue: 'Texto',
        isDisabled: false,
        onPlaceholderChange: () => undefined,
        onDefaultValueChange: () => undefined,
      }),
    )
    expect(result.current.isLongText).toBe(true)
  })
})
