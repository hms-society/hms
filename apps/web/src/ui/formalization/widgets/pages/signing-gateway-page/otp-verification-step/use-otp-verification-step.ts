export type OtpVerificationStepProps = {
  code: string
  expiresAt: string
  resendAvailableAt: string
  error?: 'invalid' | 'expired' | 'locked'
  isPending: boolean
  onCodeChange: (code: string) => void
  onVerify: () => void
  onResend: () => void
}

export function useOtpVerificationStep(props: OtpVerificationStepProps) {
  function handleCodeChange(code: string) {
    props.onCodeChange(code)
  }
  function handleVerify() {
    props.onVerify()
  }
  function handleResend() {
    props.onResend()
  }
  return { handleCodeChange, handleResend, handleVerify, isPending: props.isPending }
}
