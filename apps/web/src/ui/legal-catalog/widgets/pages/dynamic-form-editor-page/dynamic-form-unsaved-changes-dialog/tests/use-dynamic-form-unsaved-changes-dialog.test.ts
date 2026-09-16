import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormUnsavedChangesDialog } from '../use-dynamic-form-unsaved-changes-dialog'

describe('use-dynamic-form-unsaved-changes-dialog', () => {
  it('preserves discard and continue handlers', () => {
    const props = {
      open: true,
      onContinueEditing: vi.fn(),
      onDiscardChanges: vi.fn(),
    }
    const { result } = renderHook(() => useDynamicFormUnsavedChangesDialog(props))
    expect(result.current).toBe(props)
  })
})
