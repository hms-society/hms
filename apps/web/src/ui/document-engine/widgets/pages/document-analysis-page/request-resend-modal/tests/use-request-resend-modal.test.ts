import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useRequestResendModal } from '../use-request-resend-modal'

describe('useRequestResendModal', () => {
  it('creates a recipient-specific message and sends edits', () => {
    const onSend = vi.fn()
    const { result } = renderHook(() =>
      useRequestResendModal({
        recipientName: 'Mariana Costa Silva',
        onSend,
      }),
    )

    expect(result.current.message).toContain('Olá, Mariana.')

    act(() => {
      result.current.handleMessageChange('Envie o verso do documento.')
    })
    act(() => result.current.handleSend())

    expect(onSend).toHaveBeenCalledWith('Envie o verso do documento.')
  })
})
