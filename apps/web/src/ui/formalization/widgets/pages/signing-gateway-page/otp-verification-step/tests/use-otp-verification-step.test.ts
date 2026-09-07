import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOtpVerificationStep } from '../use-otp-verification-step'

describe('useOtpVerificationStep', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-02T11:59:30Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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
    expect(result.current.remainingSeconds).toBe(30)
    expect(result.current.remainingTimeLabel).toBe('00:30')
    expect(result.current.resendTimeLabel).toBe('00:30')
    expect(result.current.canResend).toBe(false)
    expect(result.current.canVerify).toBe(false)
    act(() => {
      result.current.handleCodeChange('123456')
      result.current.handleVerify()
      result.current.handleResend()
    })
    expect(onCodeChange).toHaveBeenCalledWith('123456')
    expect(onVerify).toHaveBeenCalledOnce()
    expect(onResend).toHaveBeenCalledOnce()
  })

  it('updates the expiration and resend states as time passes', () => {
    const { result } = renderHook(() =>
      useOtpVerificationStep({
        code: '',
        expiresAt: '2026-09-02T12:00:00Z',
        resendAvailableAt: '2026-09-02T11:59:45Z',
        isPending: false,
        onCodeChange: vi.fn(),
        onVerify: vi.fn(),
        onResend: vi.fn(),
      }),
    )

    expect(result.current.isExpired).toBe(false)
    expect(result.current.canResend).toBe(false)

    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.remainingSeconds).toBe(15)
    expect(result.current.remainingTimeLabel).toBe('00:15')
    expect(result.current.resendTimeLabel).toBe('00:00')
    expect(result.current.canResend).toBe(true)

    act(() => vi.advanceTimersByTime(15_000))

    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.remainingTimeLabel).toBe('00:00')
    expect(result.current.isExpired).toBe(true)
    expect(result.current.canVerify).toBe(false)
  })

  it('keeps resend unavailable while a request is pending', () => {
    const { result } = renderHook(() =>
      useOtpVerificationStep({
        code: '',
        expiresAt: '2026-09-02T11:59:00Z',
        resendAvailableAt: '2026-09-02T11:59:00Z',
        isPending: true,
        onCodeChange: vi.fn(),
        onVerify: vi.fn(),
        onResend: vi.fn(),
      }),
    )

    expect(result.current.isExpired).toBe(true)
    expect(result.current.canResend).toBe(false)
    expect(result.current.canVerify).toBe(false)
  })

  it('treats invalid or past deadlines as immediately unavailable or expired', () => {
    const { result } = renderHook(() =>
      useOtpVerificationStep({
        code: '',
        expiresAt: 'not-a-date',
        resendAvailableAt: '2020-01-01T00:00:00Z',
        isPending: false,
        onCodeChange: vi.fn(),
        onVerify: vi.fn(),
        onResend: vi.fn(),
      }),
    )

    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.isExpired).toBe(true)
    expect(result.current.canResend).toBe(true)
  })

  it('cleans up the clock when the widget unmounts', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    const { unmount } = renderHook(() =>
      useOtpVerificationStep({
        code: '',
        expiresAt: '2026-09-02T12:00:00Z',
        resendAvailableAt: '2026-09-02T12:00:00Z',
        isPending: false,
        onCodeChange: vi.fn(),
        onVerify: vi.fn(),
        onResend: vi.fn(),
      }),
    )

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalledOnce()
    clearIntervalSpy.mockRestore()
  })
})
