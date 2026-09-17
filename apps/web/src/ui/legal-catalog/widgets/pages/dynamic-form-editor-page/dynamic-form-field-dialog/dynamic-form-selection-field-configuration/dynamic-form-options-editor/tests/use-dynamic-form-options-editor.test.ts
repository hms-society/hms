import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormOptionsEditor } from '../use-dynamic-form-options-editor'

describe('use-dynamic-form-options-editor', () => {
  it('sorts options through drag events while keeping stable IDs and localized guidance', () => {
    const onChange = vi.fn()
    const options = [
      { clientId: 'option-1', label: 'Primeira' },
      { clientId: 'option-2', label: 'Segunda' },
    ]
    const { result } = renderHook(() =>
      useDynamicFormOptionsEditor({
        mode: 'multiple_selection',
        options,
        defaultOptionClientIds: ['option-1'],
        isDisabled: false,
        errors: [],
        onChange,
      }),
    )
    act(() =>
      result.current.onDragEnd({
        active: { id: 'option-2' },
        over: { id: 'option-1' },
      } as never),
    )
    expect(onChange).toHaveBeenLastCalledWith({
      options: [options[1], options[0]],
      defaultOptionClientIds: ['option-1'],
    })
    expect(
      result.current.announcements.onDragStart({
        active: { id: 'option-2' },
      } as never),
    ).toContain('Opção Segunda')
    expect(result.current.screenReaderInstructions.draggable).toContain('Espaço')
    act(() => result.current.toggleDefault('option-2'))
    expect(onChange).toHaveBeenLastCalledWith({
      options,
      defaultOptionClientIds: ['option-1', 'option-2'],
    })
    act(() => result.current.addOption())
    const added = onChange.mock.lastCall?.[0].options[2]
    expect(added.clientId).toBeTruthy()
    expect(added.label).toBe('')
  })
})
