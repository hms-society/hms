import type { FormEvent } from 'react'

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSignInAction } from '../use-sign-in-action'
import { useSignInPage } from '../use-sign-in-page'

vi.mock('../use-sign-in-action', () => ({
  useSignInAction: vi.fn(),
}))

const useSignInActionMock = vi.mocked(useSignInAction)

describe('Use Sign In Page', () => {
  const signIn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useSignInActionMock.mockReturnValue({
      error: null,
      isPending: false,
      signIn,
    })
  })

  it('starts with password hidden and exposes the loading state', () => {
    const { result } = renderHook(() => useSignInPage())

    expect(result.current.showPassword).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('toggles password visibility', () => {
    const { result } = renderHook(() => useSignInPage())

    act(() => result.current.handleTogglePasswordVisibility())
    expect(result.current.showPassword).toBe(true)

    act(() => result.current.handleTogglePasswordVisibility())
    expect(result.current.showPassword).toBe(false)
  })

  it('submits the email and password to the sign-in action', async () => {
    const { result } = renderHook(() => useSignInPage())

    act(() => {
      result.current.register('email').onChange({
        target: { name: 'email', value: 'user@example.com' },
        type: 'change',
      } as never)
      result.current.register('password').onChange({
        target: { name: 'password', value: 'secret-password' },
        type: 'change',
      } as never)
    })

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
        persist: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>)
    })

    expect(signIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret-password',
    })
  })
})
