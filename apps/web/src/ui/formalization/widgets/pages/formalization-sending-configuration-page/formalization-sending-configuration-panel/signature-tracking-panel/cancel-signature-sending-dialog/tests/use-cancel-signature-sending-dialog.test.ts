import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useCancelSignatureSendingDialog } from '../use-cancel-signature-sending-dialog'

function setup(overrides: Record<string, unknown> = {}) {
  return renderHook(() =>
    useCancelSignatureSendingDialog({
      open: true,
      formalizationVersion: 5,
      requestVersion: 6,
      isPending: false,
      error: null,
      onOpenChange: vi.fn(),
      onSubmit: vi.fn().mockResolvedValue({}),
      ...overrides,
    }),
  )
}

describe('useCancelSignatureSendingDialog', () => {
  it('rejects blank and overlong normalized reasons', async () => {
    const { result } = setup()
    await act(async () => result.current.handleSubmit())
    expect(result.current.validationError).toBe('Informe o motivo do cancelamento.')

    act(() => result.current.handleReasonChange('x'.repeat(501)))
    await act(async () => result.current.handleSubmit())
    expect(result.current.validationError).toBe(
      'O motivo deve ter no máximo 500 caracteres.',
    )
  })

  it('submits versions and clears reason only after success', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    const onOpenChange = vi.fn()
    const { result } = setup({ onSubmit, onOpenChange })
    act(() => result.current.handleReasonChange('  cliente desistiu '))
    await act(async () => result.current.handleSubmit())

    expect(onSubmit).toHaveBeenCalledWith({
      expectedFormalizationVersion: 5,
      expectedRequestVersion: 6,
      reason: 'cliente desistiu',
    })
    expect(result.current.reason).toBe('')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
