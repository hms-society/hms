import type { SignatureResultDto } from '@hms/validation/formalization'
import type { FormalizationSignatureUnavailableReason } from '@hms/core/formalization/domain/structures'

export type SigningUnavailableStepProps = {
  reason: FormalizationSignatureUnavailableReason
  result?: SignatureResultDto
  retryAt?: string
  error?: string
  onRetry?: () => void
}

export function useSigningUnavailableStep(props: SigningUnavailableStepProps) {
  function handleRetry() {
    props.onRetry?.()
  }
  return { handleRetry }
}
