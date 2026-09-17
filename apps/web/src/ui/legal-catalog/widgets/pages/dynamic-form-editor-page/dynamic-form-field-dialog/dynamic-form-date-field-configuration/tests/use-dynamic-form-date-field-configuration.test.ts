import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDynamicFormDateFieldConfiguration } from '../use-dynamic-form-date-field-configuration'

describe('use-dynamic-form-date-field-configuration', () => {
  it('preserves the date default and validation message', () => {
    const props = {
      fieldClientId: 'field-1',
      defaultValue: '2025-01-20',
      isDisabled: false,
      defaultValueError: 'Data inválida',
      onDefaultValueChange: () => undefined,
    }
    const { result } = renderHook(() => useDynamicFormDateFieldConfiguration(props))
    expect(result.current).toEqual(props)
  })
})
