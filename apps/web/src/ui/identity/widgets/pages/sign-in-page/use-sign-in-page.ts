import { useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'

import type { ROUTES } from '@/constants/routes'
import { useSignInAction } from '@/ui/identity/hooks/use-sign-in-action'

type SignInFormValues = {
  email: string
  password: string
}

export type SignInPageProps = {
  returnTo?: typeof ROUTES.signingGateway
}

export function useSignInPage(props: SignInPageProps = {}) {
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, isPending: isLoading, error } = useSignInAction(props.returnTo)
  const { handleSubmit: handleFormSubmit, register } = useForm<SignInFormValues>()

  function handleTogglePasswordVisibility() {
    setShowPassword(function togglePasswordVisibility(previousValue) {
      return !previousValue
    })
  }

  function handleSignIn(values: SignInFormValues) {
    const { email, password } = values
    signIn({ email, password })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    void handleFormSubmit(handleSignIn)(event)
  }

  return {
    error,
    isLoading,
    showPassword,
    handleSubmit,
    handleTogglePasswordVisibility,
    register,
  }
}
