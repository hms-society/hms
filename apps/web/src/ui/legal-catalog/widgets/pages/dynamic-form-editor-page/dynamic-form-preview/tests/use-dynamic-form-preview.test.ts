import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDynamicFormPreview } from '../use-dynamic-form-preview'

describe('use-dynamic-form-preview', () => {
  it('hydrates defaults and delegates answer changes by stable field ID', () => {
    const fields = [
      {
        clientId: 'field-1',
        label: 'Nome',
        type: 'short_text' as const,
        required: true,
        defaultValue: 'Maria',
      },
    ]
    const { result } = renderHook(() => useDynamicFormPreview({ fields }))
    expect(result.current.answers['field-1']).toBe('Maria')
    act(() => result.current.onChange('field-1', 'João'))
    expect(result.current.answers['field-1']).toBe('João')
  })
})
