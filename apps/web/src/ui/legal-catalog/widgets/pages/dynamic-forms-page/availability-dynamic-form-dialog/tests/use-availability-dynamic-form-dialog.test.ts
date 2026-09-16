import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAvailabilityDynamicFormDialog } from '../use-availability-dynamic-form-dialog'

describe('useAvailabilityDynamicFormDialog', () => {
  it('disables confirmation only while the mutation is pending', () => {
    const { result } = renderHook(() =>
      useAvailabilityDynamicFormDialog({
        form: null,
        open: true,
        isMutationPending: true,
        errorMessage: null,
        onOpenChange: vi.fn(),
        onConfirm: vi.fn().mockResolvedValue(undefined),
      }),
    )
    expect(result.current.isDisabled).toBe(true)
    act(() => result.current.handleOpenChange(false))

    const { result: readyResult } = renderHook(() =>
      useAvailabilityDynamicFormDialog({
        form: null,
        open: true,
        isMutationPending: false,
        errorMessage: null,
        onOpenChange: vi.fn(),
        onConfirm: vi.fn().mockResolvedValue(undefined),
      }),
    )
    expect(readyResult.current.isDisabled).toBe(false)
  })
})
