import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAvailabilityDynamicFormDialog } from '../use-availability-dynamic-form-dialog'

describe('useAvailabilityDynamicFormDialog', () => {
  it('disables confirmation until live impact is available', () => {
    const { result } = renderHook(() =>
      useAvailabilityDynamicFormDialog({
        form: null,
        open: true,
        impact: null,
        isImpactPending: true,
        isImpactError: false,
        isMutationPending: false,
        errorMessage: null,
        onOpenChange: vi.fn(),
        onRetryImpact: vi.fn(),
        onConfirm: vi.fn().mockResolvedValue(undefined),
      }),
    )
    expect(result.current.isDisabled).toBe(true)
    act(() => result.current.handleOpenChange(false))
  })

  it('enables confirmation when impact data is available', () => {
    const { result } = renderHook(() =>
      useAvailabilityDynamicFormDialog({
        form: null,
        open: true,
        impact: {
          consultation: { total: 1, inProgress: 0 },
          formalization: { total: 0, inProgress: 0 },
        },
        isImpactPending: false,
        isImpactError: false,
        isMutationPending: false,
        errorMessage: null,
        onOpenChange: vi.fn(),
        onRetryImpact: vi.fn(),
        onConfirm: vi.fn().mockResolvedValue(undefined),
      }),
    )
    expect(result.current.isDisabled).toBe(false)
  })

  it('blocks confirmation and exposes impact retry after a failure', () => {
    const onRetryImpact = vi.fn()
    const { result } = renderHook(() =>
      useAvailabilityDynamicFormDialog({
        form: null,
        open: true,
        impact: null,
        isImpactPending: false,
        isImpactError: true,
        isMutationPending: false,
        errorMessage: null,
        onOpenChange: vi.fn(),
        onRetryImpact,
        onConfirm: vi.fn().mockResolvedValue(undefined),
      }),
    )

    expect(result.current.formatImpact()).toBe('Não foi possível calcular os impactos.')
    expect(result.current.isDisabled).toBe(true)
    act(() => result.current.handleRetryImpact())
    expect(onRetryImpact).toHaveBeenCalledOnce()
  })
})
