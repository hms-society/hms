import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormDeleteDialog } from '../use-dynamic-form-delete-dialog'

describe('use-dynamic-form-delete-dialog', () => {
  it('blocks confirmation only while deleting or without a form', () => {
    const props = {
      open: true,
      form: { name: 'Ficha', id: 'form-1' },
      isDirty: true,
      isDeleting: false,
      errorMessage: 'Falha ao excluir',
      onOpenChange: vi.fn(),
      onDeleted: vi.fn(),
    } as unknown as Parameters<typeof useDynamicFormDeleteDialog>[0]
    const { result } = renderHook(() => useDynamicFormDeleteDialog(props))
    expect(result.current.isDisabled).toBe(false)

    const { result: pendingResult } = renderHook(() =>
      useDynamicFormDeleteDialog({ ...props, isDeleting: true }),
    )
    expect(pendingResult.current.isDisabled).toBe(true)

    const { result: emptyResult } = renderHook(() =>
      useDynamicFormDeleteDialog({ ...props, form: null }),
    )
    expect(emptyResult.current.isDisabled).toBe(true)
  })
})
