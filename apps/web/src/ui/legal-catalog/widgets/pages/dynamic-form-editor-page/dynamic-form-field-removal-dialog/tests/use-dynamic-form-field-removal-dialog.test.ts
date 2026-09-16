import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDynamicFormFieldRemovalDialog } from '../use-dynamic-form-field-removal-dialog'

vi.mock('@/ui/legal-catalog/hooks', () => ({
  useDynamicFormFieldUsageImpactQuery: () => ({
    isFetching: false,
    isError: false,
    data: undefined,
    refetch: vi.fn(),
  }),
}))

describe('use-dynamic-form-field-removal-dialog', () => {
  it('allows removal when a field is selected', () => {
    const base = {
      open: true,
      field: {
        clientId: 'field-1',
        label: 'Contrato',
        type: 'short_text' as const,
        required: false,
      },
      onOpenChange: () => undefined,
      onConfirm: () => undefined,
    }
    const { result } = renderHook(() => useDynamicFormFieldRemovalDialog(base))
    expect(result.current.canConfirm).toBe(true)

    const { result: emptyResult } = renderHook(() =>
      useDynamicFormFieldRemovalDialog({ ...base, field: null }),
    )
    expect(emptyResult.current.canConfirm).toBe(false)
  })
})
