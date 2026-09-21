import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormEditorOverlays } from '../use-dynamic-form-editor-overlays'

describe('use-dynamic-form-editor-overlays', () => {
  it('closes a dialog and navigates after discarding changes', () => {
    const closeOverlay = vi.fn()
    const setBypassBlocker = vi.fn()
    const navigateTo = vi.fn()
    const { result } = renderHook(() =>
      useDynamicFormEditorOverlays({
        editor: {
          draft: { fields: [] },
          overlay: { kind: 'unsaved-navigation' },
          selectedField: null,
          detailQuery: { data: undefined },
          closeOverlay,
          setBypassBlocker,
          navigateTo,
        } as never,
      } as never),
    )

    act(() => result.current.discardChanges())
    expect(setBypassBlocker).toHaveBeenCalledWith(true)
    expect(closeOverlay).toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith('dynamicForms')
  })
})
