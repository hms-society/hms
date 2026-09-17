import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DynamicFormEditorSaveState } from '../../types'
import { useDynamicFormSaveBar } from '../use-dynamic-form-save-bar'

describe('use-dynamic-form-save-bar', () => {
  it('derives save availability and localized status messages', () => {
    const { result, rerender } = renderHook<
      ReturnType<typeof useDynamicFormSaveBar>,
      DynamicFormEditorSaveState
    >(
      (state) =>
        useDynamicFormSaveBar({
          state,
          canDelete: true,
          onSave: () => undefined,
          onRetry: () => undefined,
          onDelete: () => undefined,
        }),
      { initialProps: { kind: 'dirty', isValid: true } },
    )
    expect(result.current.canSave).toBe(true)
    expect(result.current.message).toBe('Alterações não salvas')
    rerender({ kind: 'saving' as const })
    expect(result.current.canSave).toBe(false)
    expect(result.current.message).toBe('Salvando alterações…')
  })
})
