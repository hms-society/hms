import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

import { useResetPasswordAction } from './use-reset-password-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type ResetPasswordStatus = 'idle' | 'loading' | 'success' | 'error'

const REDIRECT_DELAY_MS = 3000

export function useResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<ResetPasswordStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const { resetPassword, isLoading, sessionChecked, sessionReady } =
    useResetPasswordAction()
  const { navigateTo } = useNavigation()

  useEffect(() => {
    if (!sessionChecked || sessionReady) return

    setErrorMessage('Link de recuperação inválido ou expirado.')
    setStatus('error')
  }, [sessionChecked, sessionReady])

  useEffect(() => {
    if (status !== 'success') return

    const timer = window.setTimeout(() => {
      navigateTo('login')
    }, REDIRECT_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [navigateTo, status])

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value)
  }

  function handleConfirmPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(event.target.value)
  }

  function handleTogglePasswordVisibility() {
    setShowPassword((previousValue) => !previousValue)
  }

  function handleResetPasswordSuccess() {
    setStatus('success')
  }

  function handleResetPasswordError(error: Error) {
    setErrorMessage(error.message)
    setStatus('error')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.')
      setStatus('error')
      return
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.')
      setStatus('error')
      return
    }

    setStatus('idle')
    resetPassword(password, {
      onError: handleResetPasswordError,
      onSuccess: handleResetPasswordSuccess,
    })
  }

  return {
    confirmPassword,
    errorMessage,
    handleConfirmPasswordChange,
    handlePasswordChange,
    handleSubmit,
    handleTogglePasswordVisibility,
    isLoading,
    password,
    sessionChecked,
    sessionReady,
    showPassword,
    status,
  }
}
