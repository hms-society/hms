import type { SignatureResultDto } from '@hms/validation/formalization'

export type SignatureSubmittedStepProps = {
  result: SignatureResultDto
  onRefresh: () => void
  onClose: () => void
}

export function useSignatureSubmittedStep(props: SignatureSubmittedStepProps) {
  function handleRefresh() {
    props.onRefresh()
  }
  function handleClose() {
    props.onClose()
  }
  return { handleClose, handleRefresh }
}
