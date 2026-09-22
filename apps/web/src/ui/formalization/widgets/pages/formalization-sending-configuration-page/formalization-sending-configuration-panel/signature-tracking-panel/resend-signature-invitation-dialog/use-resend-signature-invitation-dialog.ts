import type {
  FormalizationSignatureTrackingSignatory,
  ResendFormalizationSignatureInvitationCommand,
  ResendFormalizationSignatureInvitationResult,
} from '@hms/core/formalization/domain/structures'

export type ResendSignatureInvitationDialogProps = {
  open: boolean
  signatory: FormalizationSignatureTrackingSignatory | null
  isPending: boolean
  error: Error | null
  onOpenChange: (open: boolean) => void
  onSubmit: (
    recipientId: string,
    input: ResendFormalizationSignatureInvitationCommand,
  ) => Promise<ResendFormalizationSignatureInvitationResult>
}

export function useResendSignatureInvitationDialog({
  signatory,
  isPending,
  error,
  onOpenChange,
  onSubmit,
}: ResendSignatureInvitationDialogProps) {
  async function handleSubmit() {
    if (!signatory || isPending) return

    await onSubmit(signatory.recipientId, {
      expectedRecipientVersion: signatory.recipientVersion,
      expectedInvitationGeneration: signatory.invitationGeneration ?? 0,
    })
    onOpenChange(false)
  }

  return {
    handleSubmit,
    message: error
      ? 'Não foi possível reenviar o convite. Atualize o acompanhamento e tente novamente.'
      : undefined,
  }
}
