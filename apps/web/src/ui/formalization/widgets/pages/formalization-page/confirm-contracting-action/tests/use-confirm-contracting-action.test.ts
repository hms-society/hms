import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useConfirmContractingAction } from '../use-confirm-contracting-action'

describe('useConfirmContractingAction', () => {
  it('submits all aggregate versions with one key and resets the key after success', async () => {
    const onConfirm = vi.fn().mockResolvedValue({})
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('11111111-1111-4111-8111-111111111111')
    const { result } = renderHook(() =>
      useConfirmContractingAction({
        intakeVersion: 12,
        status: {
          canConfirmContracting: true,
          formalizationVersion: 8,
          version: 9,
        } as never,
        isLoading: false,
        isPending: false,
        error: null,
        onConfirm,
      }),
    )

    await act(async () => result.current.handleSubmit())
    expect(onConfirm).toHaveBeenCalledWith({
      confirmationKey: '11111111-1111-4111-8111-111111111111',
      expectedFormalizationVersion: 8,
      expectedIntakeVersion: 12,
      expectedRequestVersion: 9,
    })
    expect(result.current.isCompleted).toBe(true)
    randomUUID.mockRestore()
  })

  it('does not submit when status is unavailable, busy or not ready', async () => {
    const onConfirm = vi.fn()
    const { result } = renderHook(() =>
      useConfirmContractingAction({
        intakeVersion: 12,
        status: null,
        isLoading: false,
        isPending: false,
        error: null,
        onConfirm,
      }),
    )

    await act(async () => result.current.handleSubmit())
    expect(onConfirm).not.toHaveBeenCalled()
    expect(result.current.canConfirm).toBe(false)
  })
})
