import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDynamicFormBooleanFieldConfiguration } from '../use-dynamic-form-boolean-field-configuration'

describe('use-dynamic-form-boolean-field-configuration', () => {
  it('returns the selected default and disabled state', () => {
    const props = {
      fieldClientId: 'field-1',
      defaultValue: true,
      isDisabled: true,
      defaultValueError: 'Inválido',
      onDefaultValueChange: () => undefined,
    }
    const { result } = renderHook(() => useDynamicFormBooleanFieldConfiguration(props))
    expect(result.current).toEqual(props)
  })
})
