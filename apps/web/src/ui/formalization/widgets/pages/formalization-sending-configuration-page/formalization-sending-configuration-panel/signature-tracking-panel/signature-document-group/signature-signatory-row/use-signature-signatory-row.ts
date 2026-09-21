import type { FormalizationSignatureTrackingSignatory } from '@hms/core/formalization/domain/structures'

export type SignatureSignatoryRowProps = {
  signatory: FormalizationSignatureTrackingSignatory
  isResending: boolean
  onRequestResend: (signatory: FormalizationSignatureTrackingSignatory) => void
}

export function useSignatureSignatoryRow({
  signatory,
  isResending,
}: SignatureSignatoryRowProps) {
  function getStatusLabel() {
    const labels: Record<string, string> = {
      invited: 'Convite',
      authenticating: 'Autenticando',
      locked: 'Acesso bloqueado',
      authenticated: 'Autenticado',
      reading: 'Lendo documento',
      signing: 'Assinando',
      submitted: 'Assinado',
      reconciliation_required: 'Reconciliação necessária',
      confirmed: 'Assinado',
      rejected: 'Rejeitada',
      cancelled: 'Cancelada',
      expired: 'Expirada',
    }
    return labels[signatory.status] ?? 'Pendente'
  }

  function getChannelLabel() {
    return signatory.deliveryChannel === 'email' ? 'E-mail' : 'Canal configurado'
  }

  function formatDate(value: Date | undefined) {
    return value
      ? new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(value)
      : 'Ainda não registrado'
  }

  function getActionLabel() {
    if (isResending) return 'Reenviando convite'
    if (!signatory.canResend) return 'Reenvio indisponível'
    return `Reenviar convite para ${signatory.displayName}`
  }

  return {
    channelLabel: getChannelLabel(),
    getActionLabel,
    invitedAtLabel: formatDate(signatory.invitedAt),
    statusLabel: getStatusLabel(),
    submittedAtLabel: formatDate(signatory.submittedAt),
  }
}
