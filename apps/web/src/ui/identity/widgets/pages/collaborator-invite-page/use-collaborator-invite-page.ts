import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'

import { useCompleteCollaboratorInviteAction } from '@/ui/identity/hooks/use-complete-collaborator-invite-action'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type InviteStatus = 'idle' | 'error' | 'success'

export type CollaboratorInviteSearch = {
  code?: string
  error?: string
  error_code?: string
  error_description?: string
}

export function useCollaboratorInvitePage(search: CollaboratorInviteSearch = {}) {
  const { isLoading: isLoadingSession, session } = useAuthContext()
  const { isCompletingCollaboratorInvite, completeCollaboratorInvite } =
    useCompleteCollaboratorInviteAction()
  const { navigateTo } = useNavigation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<InviteStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasCheckedSession, setHasCheckedSession] = useState(false)
  const inviteUrlState = getInviteUrlState(search)
  const isInviteUnavailable = hasCheckedSession && (!session || inviteUrlState.hasError)

  useEffect(
    function markSessionAsChecked() {
      if (!isLoadingSession) setHasCheckedSession(true)
    },
    [isLoadingSession],
  )

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
    void completeCollaboratorInvite(password)
      .then(function handleInviteSuccess() {
        setStatus('success')
        setErrorMessage('')
        void navigateTo('home')
      })
      .catch(function handleInviteError(error: Error) {
        setErrorMessage(error.message)
        setStatus('error')
      })
  }

  return {
    confirmPassword,
    errorMessage,
    hasCheckedSession,
    inviteUnavailableMessage: getInviteUnavailableMessage(inviteUrlState.hasError),
    isInviteUnavailable,
    isLoading: isLoadingSession || isCompletingCollaboratorInvite,
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

function getInviteUrlState(search: CollaboratorInviteSearch) {
  const hash = getHashSearchParams()
  const hasError = Boolean(
    search.error ||
      search.error_code ||
      search.error_description ||
      hash.get('error') ||
      hash.get('error_code') ||
      hash.get('error_description'),
  )

  return { hasError }
}

function getHashSearchParams() {
  if (typeof window === 'undefined') return new URLSearchParams()

  return new URLSearchParams(window.location.hash.replace(/^#/, ''))
}

function getInviteUnavailableMessage(hasInviteError: boolean) {
  if (hasInviteError) {
    return 'O link de convite é inválido ou expirou. Solicite um novo convite ao administrador.'
  }

  return 'Abra esta página pelo link recebido no convite. Se o link expirou, solicite um novo convite ao administrador.'
}
