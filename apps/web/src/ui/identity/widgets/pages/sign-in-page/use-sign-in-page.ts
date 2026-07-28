import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useSignInAction } from './use-sign-in-action'

type SignInFormValues = {
  email: string
  password: string
}

export function useSignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, isPending: isLoading, error } = useSignInAction()
  const { handleSubmit: handleFormSubmit, register } = useForm<SignInFormValues>()

  function handleTogglePasswordVisibility() {
    setShowPassword((previousValue) => !previousValue)
  }

  function handleSignIn(values: SignInFormValues) {
    const { email, password } = values
    signIn({ email, password })
  }

  return {
    error,
    isLoading,
    showPassword,
    handleSubmit: handleFormSubmit(handleSignIn),
    handleTogglePasswordVisibility,
    register,
  }
}
