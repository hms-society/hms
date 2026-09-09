import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'

import { useCollaboratorLoginStep } from '../use-collaborator-login-step'

describe('useCollaboratorLoginStep', () => {
  it('delegates the protected login continuation and exposes pending state', () => {
    const onContinue = vi.fn()
    const { result } = renderHook(() =>
      useCollaboratorLoginStep({
        loginPath: '/login?returnTo=%2Fassinaturas%2Facesso',
        isPending: true,
        onContinue,
      }),
    )

    expect(result.current.isPending).toBe(true)
    expect(result.current.loginSearch).toEqual({ returnTo: ROUTES.signingGateway })
    act(() => result.current.handleContinue())
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('exposes the ready state for an already authenticated collaborator', () => {
    const { result } = renderHook(() =>
      useCollaboratorLoginStep({
        loginPath: '/login?returnTo=%2Fassinaturas%2Facesso',
        isPending: false,
        onContinue: vi.fn(),
      }),
    )

    expect(result.current.isPending).toBe(false)
  })

  it('drops a non-canonical login target instead of navigating to it', () => {
    const { result } = renderHook(() =>
      useCollaboratorLoginStep({
        loginPath: 'https://unsafe.example/login?returnTo=%2Fhome',
        isPending: false,
        onContinue: vi.fn(),
      }),
    )

    expect(result.current.loginSearch).toBeUndefined()
  })

  it('explains when the authenticated account is not the assigned collaborator', () => {
    const { result } = renderHook(() =>
      useCollaboratorLoginStep({
        error: 'account_mismatch',
        loginPath: '/login?returnTo=%2Fassinaturas%2Facesso',
        isPending: false,
        onContinue: vi.fn(),
      }),
    )

    expect(result.current.description).toContain('conta correta')
  })
})
