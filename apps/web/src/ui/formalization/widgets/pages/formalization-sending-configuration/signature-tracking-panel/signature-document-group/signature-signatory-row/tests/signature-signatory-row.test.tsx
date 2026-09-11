import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FormalizationSignatureTrackingSignatory } from '@hms/core/formalization/domain/structures'

import { SignatureSignatoryRow } from '..'

const signatory: FormalizationSignatureTrackingSignatory = {
  recipientId: 'recipient-1',
  recipientVersion: 1,
  displayName: 'Ana Maria',
  actorKind: 'client',
  deliveryChannel: 'email',
  status: 'confirmed',
  canResend: false,
  confirmedAt: new Date('2026-08-26T12:00:00.000Z'),
} as const

describe('SignatureSignatoryRow', () => {
  afterEach(cleanup)

  it('shows recipient facts, status and a disabled explained resend action', () => {
    render(
      <SignatureSignatoryRow
        signatory={signatory}
        isResending={false}
        onRequestResend={vi.fn()}
      />,
    )

    expect(screen.getByText('Ana Maria')).not.toBeNull()
    expect(screen.getByText('AM')).not.toBeNull()
    expect(screen.getAllByText('Assinado')).toHaveLength(2)
    expect(
      screen.getByText('Assinado', { selector: 'span' }).getAttribute('data-variant'),
    ).toBe('success')
    expect(screen.getByText('E-mail')).not.toBeNull()
    expect(screen.getByText('Convite')).not.toBeNull()
    expect(screen.queryByText('Envio')).toBeNull()
    expect(screen.queryByText('Confirmação')).toBeNull()
    expect(screen.getAllByText('Ainda não registrado')).toHaveLength(2)
    expect(
      (screen.getByRole('button', { name: 'Reenvio indisponível' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  it('sends the selected recipient through the accessible resend action', () => {
    const onRequestResend = vi.fn()
    render(
      <SignatureSignatoryRow
        signatory={{ ...signatory, canResend: true }}
        isResending={false}
        onRequestResend={onRequestResend}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Reenviar convite para Ana Maria' }),
    )
    expect(onRequestResend).toHaveBeenCalledWith({ ...signatory, canResend: true })
  })
})
