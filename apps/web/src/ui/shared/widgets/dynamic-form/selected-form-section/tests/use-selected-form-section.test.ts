import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useSelectedFormSection } from '../use-selected-form-section'

describe('useSelectedFormSection', () => {
  it('preserves the shared section contract', () => {
    const props = {
      selectedFormName: 'Triagem inicial',
      fields: [],
      answers: {},
      errors: {},
      onChange: vi.fn(),
      onOpenSelectModal: vi.fn(),
    }
    const { result } = renderHook(() => useSelectedFormSection(props))

    expect(result.current).toBe(props)
  })
})
