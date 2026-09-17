import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDeleteDynamicFormDialog } from '../use-delete-dynamic-form-dialog'

describe('useDeleteDynamicFormDialog', () => {
  it('blocks confirmation while deleting or without a selected form', () => {
    const { result } = renderHook(() =>
      useDeleteDynamicFormDialog({
        form: null,
        open: true,
        isMutationPending: true,
        errorMessage: 'Falha',
        onOpenChange: vi.fn(),
        onConfirm: vi.fn().mockResolvedValue(undefined),
      }),
    )
    expect(result.current.isDisabled).toBe(true)

    const { result: emptyResult } = renderHook(() =>
      useDeleteDynamicFormDialog({
        form: null,
        open: true,
        isMutationPending: false,
        errorMessage: null,
        onOpenChange: vi.fn(),
        onConfirm: vi.fn().mockResolvedValue(undefined),
      }),
    )
    expect(emptyResult.current.isDisabled).toBe(true)
  })
})
