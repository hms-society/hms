import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useInvitationAccessStep } from '../use-invitation-access-step'

describe('useInvitationAccessStep', () => {
  it('preserves pending state and delegates continuation', () => {
    const onContinue = vi.fn()
    const { result } = renderHook(() =>
      useInvitationAccessStep({ isPending: true, onContinue }),
    )

    expect(result.current.isPending).toBe(true)
    act(() => result.current.handleContinue())
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('exposes an enabled state without changing the external callback contract', () => {
    const onContinue = vi.fn()
    const { result } = renderHook(() =>
      useInvitationAccessStep({ isPending: false, onContinue }),
    )

    expect(result.current.isPending).toBe(false)
    act(() => result.current.handleContinue())
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
