import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useOtpVerificationStep } from '../use-otp-verification-step'

describe('useOtpVerificationStep', () => {
  it('delegates code, verification and resend events while preserving pending state', () => {
    const onCodeChange = vi.fn()
    const onVerify = vi.fn()
    const onResend = vi.fn()
    const { result } = renderHook(() =>
      useOtpVerificationStep({
        code: '',
        expiresAt: '2026-09-02T12:00:00Z',
        resendAvailableAt: '2026-09-02T12:00:00Z',
        isPending: true,
        onCodeChange,
        onVerify,
        onResend,
      }),
    )

    expect(result.current.isPending).toBe(true)
    act(() => {
      result.current.handleCodeChange('123456')
      result.current.handleVerify()
      result.current.handleResend()
    })
    expect(onCodeChange).toHaveBeenCalledWith('123456')
    expect(onVerify).toHaveBeenCalledOnce()
    expect(onResend).toHaveBeenCalledOnce()
  })
})
