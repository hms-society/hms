import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useExtractedFields } from '../use-extracted-fields'

describe('useExtractedFields', () => {
  it('counts identified fields and selects semantic icons', () => {
    const { result } = renderHook(() =>
      useExtractedFields([
        { label: 'Titular', value: 'Mariana Costa Silva' },
        { label: 'CPF', value: '', isMissing: true },
        { label: 'Campo novo', value: 'Valor' },
      ]),
    )

    expect(result.current.extractedCount).toBe(2)
    expect(result.current.getFieldIcon('Titular')).toBe('user')
    expect(result.current.getFieldIcon('Campo novo')).toBe('file-text')
  })
})
