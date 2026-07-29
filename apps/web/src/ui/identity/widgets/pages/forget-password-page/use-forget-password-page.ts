import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

import { useForgotPasswordAction } from './use-forgot-password-action'

const RESEND_COOLDOWN_SECONDS = 15

export function useForgetPassword() {
  const [email, setEmail] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const { error, forgotPassword, isPending } = useForgotPasswordAction()

  useEffect(() => {
    if (resendTimer <= 0) return

    const timer = window.setTimeout(() => {
      setResendTimer((previousTimer) => previousTimer - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendTimer])

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value)
  }

  function handlePasswordResetRequestSuccess() {
    setIsEmailSent(true)
    setResendTimer(RESEND_COOLDOWN_SECONDS)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    forgotPassword(email, {
      onSuccess: handlePasswordResetRequestSuccess,
    })
  }

  function handleResendEmail() {
    if (resendTimer > 0) return

    forgotPassword(email, {
      onSuccess: handlePasswordResetRequestSuccess,
    })
  }

  return {
    email,
    error,
    handleEmailChange,
    handleResendEmail,
    handleSubmit,
    isEmailSent,
    isLoading: isPending,
    resendTimer,
  }
}
