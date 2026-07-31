import { useMutation } from '@tanstack/react-query'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type InviteStatus = 'idle' | 'error' | 'success'

export function useCollaboratorInvitePage() {
  const {
    getSession,
    isLoading: isLoadingSession,
    session,
    updatePassword,
  } = useAuthContext()
  const { identityService } = useRestContext()
  const { navigateTo } = useNavigation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<InviteStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasCheckedSession, setHasCheckedSession] = useState(false)

  useEffect(
    function markSessionAsChecked() {
      if (!isLoadingSession) setHasCheckedSession(true)
    },
    [isLoadingSession],
  )

  async function completeInviteRequest(nextPassword: string) {
    const currentSession = await getSession()

    if (!currentSession) {
      throw new Error('Link de convite inválido ou expirado.')
    }

    await updatePassword(nextPassword)
    const response = await identityService.completeSignIn()

    if (response.isFailure) response.throwError()

    return response.body
  }

  const { mutate: completeInvite, isPending } = useMutation({
    mutationFn: completeInviteRequest,
    onSuccess: function handleInviteSuccess() {
      setStatus('success')
      setErrorMessage('')
      void navigateTo('home')
    },
    onError: function handleInviteError(error: Error) {
      setErrorMessage(error.message)
      setStatus('error')
    },
  })

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value)
    if (status === 'error') setStatus('idle')
  }

  function handleConfirmPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(event.target.value)
    if (status === 'error') setStatus('idle')
  }

  function handleTogglePasswordVisibility() {
    setShowPassword(function togglePasswordVisibility(previousValue) {
      return !previousValue
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 6) {
      setErrorMessage('Use pelo menos 6 caracteres.')
      setStatus('error')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.')
      setStatus('error')
      return
    }

    setStatus('idle')
    completeInvite(password)
  }

  return {
    confirmPassword,
    errorMessage,
    hasCheckedSession,
    isLoading: isLoadingSession || isPending,
    password,
    session,
    showPassword,
    status,
    handleConfirmPasswordChange,
    handlePasswordChange,
    handleSubmit,
    handleTogglePasswordVisibility,
  }
}

export type CollaboratorInvitePageController = ReturnType<
  typeof useCollaboratorInvitePage
>
