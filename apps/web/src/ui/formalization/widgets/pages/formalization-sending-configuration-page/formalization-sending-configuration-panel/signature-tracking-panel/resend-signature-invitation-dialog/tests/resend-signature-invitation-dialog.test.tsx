import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FormalizationSignatureTrackingSignatory } from '@hms/core/formalization/domain/structures'

import { ResendSignatureInvitationDialog } from '..'

const signatory: FormalizationSignatureTrackingSignatory = {
  recipientId: 'recipient-1',
  recipientVersion: 4,
  invitationGeneration: 2,
  displayName: 'Ana Maria',
  actorKind: 'client',
  deliveryChannel: 'email',
  status: 'invited',
  canResend: true,
}

describe('ResendSignatureInvitationDialog', () => {
  afterEach(cleanup)

  it('requires a selected eligible recipient and submits once from the confirmation dialog', () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(
      <ResendSignatureInvitationDialog
        open
        signatory={signatory}
        isPending={false}
        error={null}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByRole('dialog').textContent).toContain('Ana Maria')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reenvio' }))
    expect(onSubmit).toHaveBeenCalledWith('recipient-1', {
      expectedRecipientVersion: 4,
      expectedInvitationGeneration: 2,
    })
  })

  it('announces failures and disables repeated submission while pending', () => {
    render(
      <ResendSignatureInvitationDialog
        open
        signatory={{ ...signatory, canResend: false }}
        isPending
        error={new Error('failed')}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain('Não foi possível reenviar')
    expect(
      (screen.getByRole('button', { name: 'Reenviando…' }) as HTMLButtonElement).disabled,
    ).toBe(true)
  })
})
