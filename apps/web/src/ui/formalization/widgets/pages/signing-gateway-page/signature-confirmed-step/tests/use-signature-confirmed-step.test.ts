import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSignatureConfirmedStep } from '../use-signature-confirmed-step'

describe('useSignatureConfirmedStep', () => {
  it('delegates the terminal close action', () => {
    const onClose = vi.fn()
    const { result } = renderHook(() =>
      useSignatureConfirmedStep({
        result: { status: 'confirmed', hmsReference: 'HMS-123', protocol: 'PROTO-1' },
        onClose,
      }),
    )

    act(() => result.current.handleClose())

    expect(onClose).toHaveBeenCalledOnce()
  })
})
