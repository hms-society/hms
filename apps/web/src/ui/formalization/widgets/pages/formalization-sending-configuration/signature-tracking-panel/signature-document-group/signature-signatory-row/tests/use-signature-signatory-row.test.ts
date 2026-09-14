import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSignatureSignatoryRow } from '../use-signature-signatory-row'

describe('useSignatureSignatoryRow', () => {
  it('maps channel/status labels and distinguishes ineligible resend', () => {
    const { result } = renderHook(() =>
      useSignatureSignatoryRow({
        signatory: {
          displayName: 'Ana',
          deliveryChannel: 'email',
          status: 'rejected',
          canResend: false,
        } as never,
        isResending: false,
        onRequestResend: () => undefined,
      }),
    )

    expect(result.current.channelLabel).toBe('E-mail')
    expect(result.current.statusLabel).toBe('Rejeitada')
    expect(result.current.getActionLabel()).toBe('Reenvio indisponível')
    expect(result.current.invitedAtLabel).toBe('Ainda não registrado')
  })

  it('uses the simplified signed label for submitted recipients', () => {
    const { result } = renderHook(() =>
      useSignatureSignatoryRow({
        signatory: {
          displayName: 'Ana',
          deliveryChannel: 'email',
          status: 'submitted',
          canResend: false,
        } as never,
        isResending: false,
        onRequestResend: () => undefined,
      }),
    )

    expect(result.current.statusLabel).toBe('Assinado')
  })

  it('announces a busy resend state', () => {
    const { result } = renderHook(() =>
      useSignatureSignatoryRow({
        signatory: { displayName: 'Ana', canResend: true } as never,
        isResending: true,
        onRequestResend: () => undefined,
      }),
    )

    expect(result.current.getActionLabel()).toBe('Reenviando convite')
  })
})
