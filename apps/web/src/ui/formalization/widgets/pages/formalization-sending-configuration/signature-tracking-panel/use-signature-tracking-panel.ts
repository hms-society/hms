import { useState } from 'react'
import type {
  CancelFormalizationSignatureSendingCommand,
  FormalizationSignatureSendingCancellationResponse,
  FormalizationSignatureSendingStatusResponse,
  FormalizationSignatureTrackingSignatory,
  ResendFormalizationSignatureInvitationCommand,
  ResendFormalizationSignatureInvitationResult,
} from '@hms/core/formalization/domain/structures'

export type SignatureTrackingPanelProps = {
  formalizationId: string
  formalizationVersion: number
  status: FormalizationSignatureSendingStatusResponse
  isRefreshing: boolean
  isResending: boolean
  isCancelling: boolean
  resendError: Error | null
  cancelError: Error | null
  onRefresh: () => Promise<void>
  onResend: (
    recipientId: string,
    input: ResendFormalizationSignatureInvitationCommand,
  ) => Promise<ResendFormalizationSignatureInvitationResult>
  onCancel: (
    input: CancelFormalizationSignatureSendingCommand,
  ) => Promise<FormalizationSignatureSendingCancellationResponse>
}

export function useSignatureTrackingPanel({
  isCancelling,
  isResending,
  onRefresh,
  status,
}: SignatureTrackingPanelProps) {
  const [selectedSignatory, setSelectedSignatory] =
    useState<FormalizationSignatureTrackingSignatory | null>(null)
  const [dialog, setDialog] = useState<'resend' | 'cancel' | null>(null)

  function handleRequestResend(signatory: FormalizationSignatureTrackingSignatory) {
    setSelectedSignatory(signatory)
    setDialog('resend')
  }

  function handleResendOpenChange(open: boolean) {
    setDialog(open ? 'resend' : null)
    if (!open) setSelectedSignatory(null)
  }

  function handleCancelOpenChange(open: boolean) {
    setDialog(open ? 'cancel' : null)
  }

  function handleRequestCancel() {
    setDialog('cancel')
  }

  async function handleRefresh() {
    await onRefresh()
  }

  return {
    dialog,
    handleCancelOpenChange,
    handleRefresh,
    handleRequestCancel,
    handleRequestResend,
    handleResendOpenChange,
    isCancelling,
    isResending,
    selectedSignatory,
    status,
  }
}
