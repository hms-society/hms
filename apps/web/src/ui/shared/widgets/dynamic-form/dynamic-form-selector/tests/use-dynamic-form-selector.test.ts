import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormSelector } from '../use-dynamic-form-selector'

describe('useDynamicFormSelector', () => {
  it('derives the context label and disabled state', () => {
    const onOpenSelectModal = vi.fn()
    const { result } = renderHook(() =>
      useDynamicFormSelector({
        selectedFormName: 'Triagem inicial',
        legalArea: 'Cível',
        legalTheme: 'Família',
        onOpenSelectModal,
        isReadOnly: true,
      }),
    )

    expect(result.current.context).toBe('Cível · Família')
    expect(result.current.isDisabled).toBe(true)
    expect(result.current.handleOpenSelectModal).toBe(onOpenSelectModal)
  })
})
