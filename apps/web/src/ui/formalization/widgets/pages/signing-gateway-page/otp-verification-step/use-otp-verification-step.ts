import { useEffect, useState } from 'react'

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
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  function getRemainingSeconds(deadline: string) {
    const deadlineTimestamp = Date.parse(deadline)

    if (Number.isNaN(deadlineTimestamp)) return 0

    return Math.max(0, Math.ceil((deadlineTimestamp - now) / 1000))
  }

  function formatRemainingTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const remainingSeconds = getRemainingSeconds(props.expiresAt)
  const resendRemainingSeconds = getRemainingSeconds(props.resendAvailableAt)
  const isExpired = remainingSeconds === 0
  const canResend = resendRemainingSeconds === 0 && !props.isPending
  const canVerify = props.code.length === 6 && !isExpired && !props.isPending

  function handleCodeChange(code: string) {
    props.onCodeChange(code)
  }
  function handleVerify() {
    props.onVerify()
  }
  function handleResend() {
    props.onResend()
  }

  return {
    canResend,
    canVerify,
    handleCodeChange,
    handleResend,
    handleVerify,
    isExpired,
    isPending: props.isPending,
    remainingSeconds,
    remainingTimeLabel: formatRemainingTime(remainingSeconds),
    resendTimeLabel: formatRemainingTime(resendRemainingSeconds),
  }
}
