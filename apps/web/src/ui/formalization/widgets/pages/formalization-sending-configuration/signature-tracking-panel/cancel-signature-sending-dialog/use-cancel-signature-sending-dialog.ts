import { useState } from 'react'
import type {
  CancelFormalizationSignatureSendingCommand,
  FormalizationSignatureSendingCancellationResponse,
} from '@hms/core/formalization/domain/structures'

export type CancelSignatureSendingDialogProps = {
  open: boolean
  formalizationVersion: number
  requestVersion: number
  isPending: boolean
  error: Error | null
  onOpenChange: (open: boolean) => void
  onSubmit: (
    input: CancelFormalizationSignatureSendingCommand,
  ) => Promise<FormalizationSignatureSendingCancellationResponse>
}

export function useCancelSignatureSendingDialog({
  formalizationVersion,
  requestVersion,
  isPending,
  error,
  onOpenChange,
  onSubmit,
}: CancelSignatureSendingDialogProps) {
  const [reason, setReason] = useState('')
  const [validationError, setValidationError] = useState<string | undefined>()

  function handleReasonChange(value: string) {
    setReason(value)
    setValidationError(undefined)
  }

  async function handleSubmit() {
    const normalizedReason = reason.trim()
    if (!normalizedReason) {
      setValidationError('Informe o motivo do cancelamento.')
      return
    }
    if (normalizedReason.length > 500) {
      setValidationError('O motivo deve ter no máximo 500 caracteres.')
      return
    }
    if (isPending) return

    await onSubmit({
      expectedFormalizationVersion: formalizationVersion,
      expectedRequestVersion: requestVersion,
      reason: normalizedReason,
    })
    setReason('')
    setValidationError(undefined)
    onOpenChange(false)
  }

  return {
    handleReasonChange,
    handleSubmit,
    reason,
    errorMessage:
      validationError ??
      (error ? 'Não foi possível cancelar o envio. Tente novamente.' : undefined),
    validationError,
  }
}
