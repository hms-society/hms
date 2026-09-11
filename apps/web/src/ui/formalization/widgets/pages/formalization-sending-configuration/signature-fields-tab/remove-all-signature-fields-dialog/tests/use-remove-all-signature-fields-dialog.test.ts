import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useRemoveAllSignatureFieldsDialog } from '../use-remove-all-signature-fields-dialog'

describe('useRemoveAllSignatureFieldsDialog', () => {
  it('confirms the removal and closes the dialog', () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    const { result } = renderHook(() =>
      useRemoveAllSignatureFieldsDialog({ onConfirm, onOpenChange }),
    )

    result.current.handleConfirm()

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
