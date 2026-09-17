import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormFieldList } from '../use-dynamic-form-field-list'

describe('use-dynamic-form-field-list', () => {
  it('moves fields and announces localized drag state', () => {
    const onMove = vi.fn()
    const fields = [
      { clientId: 'field-1', label: 'Nome', type: 'short_text' as const, required: true },
      { clientId: 'field-2', label: 'Data', type: 'date' as const, required: false },
    ]
    const { result } = renderHook(() =>
      useDynamicFormFieldList({
        fields,
        onEdit: vi.fn(),
        onRemove: vi.fn(),
        onMove,
      }),
    )
    act(() =>
      result.current.onDragEnd({
        active: { id: 'field-2' },
        over: { id: 'field-1' },
      } as never),
    )
    expect(onMove).toHaveBeenCalledWith('field-2', 0)
    expect(
      result.current.announcements.onDragStart({ active: { id: 'field-1' } } as never),
    ).toContain('Campo Nome')
    expect(result.current.screenReaderInstructions.draggable).toContain('Espaço')
  })
})
