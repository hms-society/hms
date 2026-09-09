import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSigningUnavailableStep } from '../use-signing-unavailable-step'

describe('useSigningUnavailableStep', () => {
  it('retries recoverable states when a retry action exists', () => {
    const onRetry = vi.fn()
    const { result } = renderHook(() =>
      useSigningUnavailableStep({ reason: 'provider_unavailable', onRetry }),
    )

    act(() => result.current.handleRetry())

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('keeps terminal states safe when no retry action is provided', () => {
    const { result } = renderHook(() => useSigningUnavailableStep({ reason: 'expired' }))

    expect(() => act(() => result.current.handleRetry())).not.toThrow()
  })
})
