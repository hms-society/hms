import type { SignatureResultDto } from '@hms/validation/formalization'

export type SignatureConfirmedStepProps = {
  result: SignatureResultDto & { status: 'confirmed'; protocol: string }
  onClose: () => void
}

export function useSignatureConfirmedStep(props: SignatureConfirmedStepProps) {
  function handleClose() {
    props.onClose()
  }
  return { handleClose }
}
