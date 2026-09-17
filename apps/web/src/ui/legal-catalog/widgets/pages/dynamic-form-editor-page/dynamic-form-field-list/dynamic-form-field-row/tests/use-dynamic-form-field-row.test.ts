import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormFieldRow } from '../use-dynamic-form-field-row'

vi.mock('@dnd-kit/sortable', async () => {
  const actual =
    await vi.importActual<typeof import('@dnd-kit/sortable')>('@dnd-kit/sortable')
  return {
    ...actual,
    useSortable: vi.fn(() => ({
      attributes: { role: 'button', tabIndex: 0 },
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    })),
  }
})

describe('use-dynamic-form-field-row', () => {
  it('delegates keyboard move actions to the requested neighboring index', () => {
    const onMove = vi.fn()
    const { result } = renderHook(() =>
      useDynamicFormFieldRow({
        field: {
          clientId: 'field-1',
          label: 'Contrato',
          type: 'short_text',
          required: true,
        },
        index: 1,
        count: 3,
        onEdit: vi.fn(),
        onRemove: vi.fn(),
        onMove,
      }),
    )
    act(() => result.current.moveUp())
    act(() => result.current.moveDown())
    expect(onMove).toHaveBeenNthCalledWith(1, 0)
    expect(onMove).toHaveBeenNthCalledWith(2, 2)
    expect(result.current.isFirst).toBe(false)
    expect(result.current.isLast).toBe(false)
  })
})
