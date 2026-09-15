import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDeleteDynamicFormDialog } from '../use-delete-dynamic-form-dialog'

describe('useDeleteDynamicFormDialog', () => {
  it('formats both impact groups and blocks pending confirmation', () => {
    const { result } = renderHook(() =>
      useDeleteDynamicFormDialog({
        form: null,
        open: true,
        impact: {
          consultation: { total: 4, inProgress: 2 },
          formalization: { total: 3, inProgress: 1 },
        },
        isImpactPending: false,
        isImpactError: false,
        isMutationPending: true,
        errorMessage: 'Falha',
        onOpenChange: vi.fn(),
        onRetryImpact: vi.fn(),
        onConfirm: vi.fn().mockResolvedValue(undefined),
      }),
    )
    expect(result.current.formatImpact()).toContain('Consultas: 4')
    expect(result.current.isDisabled).toBe(true)
  })

  it('blocks confirmation and retries a failed impact calculation', () => {
    const onRetryImpact = vi.fn()
    const { result } = renderHook(() =>
      useDeleteDynamicFormDialog({
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
    result.current.handleRetryImpact()
    expect(onRetryImpact).toHaveBeenCalledOnce()
  })
})
