import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useProviderSigningStep } from '../use-provider-signing-step'

describe('useProviderSigningStep', () => {
  it('delegates provider submission and unavailable outcomes independently', () => {
    const onSubmitted = vi.fn()
    const onUnavailable = vi.fn()
    const { result } = renderHook(() =>
      useProviderSigningStep({
        proxyPath: '/assinaturas/provedor/session-1',
        title: 'Contract',
        onSubmitted,
        onUnavailable,
      }),
    )

    act(() => {
      result.current.handleSubmitted()
      result.current.handleUnavailable()
    })

    expect(onSubmitted).toHaveBeenCalledOnce()
    expect(onUnavailable).toHaveBeenCalledOnce()
  })
})
