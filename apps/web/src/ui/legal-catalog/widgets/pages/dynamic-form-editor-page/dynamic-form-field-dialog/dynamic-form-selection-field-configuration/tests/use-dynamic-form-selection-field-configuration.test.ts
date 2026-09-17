import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDynamicFormSelectionFieldConfiguration } from '../use-dynamic-form-selection-field-configuration'

describe('use-dynamic-form-selection-field-configuration', () => {
  it('preserves selection options, defaults and errors', () => {
    const props = {
      fieldClientId: 'field-1',
      mode: 'single_selection' as const,
      options: [{ clientId: 'option-1', label: 'Contrato' }],
      defaultOptionClientIds: ['option-1'],
      isDisabled: false,
      defaultValueError: undefined,
      optionErrors: [],
      onChange: () => undefined,
    }
    const { result } = renderHook(() => useDynamicFormSelectionFieldConfiguration(props))
    expect(result.current).toEqual(props)
  })
})
