import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useResendSignatureInvitationDialog } from '../use-resend-signature-invitation-dialog'

describe('useResendSignatureInvitationDialog', () => {
  it('submits recipient and invitation versions, then closes on success', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    const onOpenChange = vi.fn()
    const { result } = renderHook(() =>
      useResendSignatureInvitationDialog({
        open: true,
        signatory: {
          recipientId: 'recipient-1',
          recipientVersion: 3,
          invitationGeneration: undefined,
          canResend: true,
        } as never,
        isPending: false,
        error: null,
        onOpenChange,
        onSubmit,
      }),
    )

    await act(async () => result.current.handleSubmit())

    expect(onSubmit).toHaveBeenCalledWith('recipient-1', {
      expectedRecipientVersion: 3,
      expectedInvitationGeneration: 0,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('retains the selection when the provider operation fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('failed'))
    const onOpenChange = vi.fn()
    const { result } = renderHook(() =>
      useResendSignatureInvitationDialog({
        open: true,
        signatory: { recipientId: 'recipient-1', canResend: true } as never,
        isPending: false,
        error: new Error('failed'),
        onOpenChange,
        onSubmit,
      }),
    )

    await expect(act(async () => result.current.handleSubmit())).rejects.toThrow('failed')
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(result.current.message).toContain('Não foi possível reenviar')
  })
})
