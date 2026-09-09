import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSignatureSubmittedStep } from '../use-signature-submitted-step'

describe('useSignatureSubmittedStep', () => {
  it('delegates refresh and close actions from the submitted state', () => {
    const onRefresh = vi.fn()
    const onClose = vi.fn()
    const { result } = renderHook(() =>
      useSignatureSubmittedStep({
        result: { status: 'submitted', hmsReference: 'HMS-123' },
        onRefresh,
        onClose,
      }),
    )

    act(() => {
      result.current.handleRefresh()
      result.current.handleClose()
    })

    expect(onRefresh).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
