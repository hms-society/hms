import { useCallback, useEffect, useMemo, useState } from 'react'

import type { AuthCredentials, AuthSession } from '@hms/core/identity/domain/structures'
import type { AuthProvider } from '@hms/core/identity/interfaces'

import type { AuthContextValue } from './types'

export function useAuthContextProvider(authProvider: AuthProvider): AuthContextValue {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(
    function subscribeToAuthChanges() {
      let mounted = true

      authProvider.getSession().then(function handleInitialSession(nextSession) {
        if (!mounted) return

        setSession(nextSession)
        setIsLoading(false)
      })

      const unsubscribe = authProvider.onAuthStateChange(
        function handleAuthStateChange(event, nextSession) {
          if (!mounted) return

          if (event === 'SIGNED_OUT') {
            setSession(null)
            setIsLoading(false)
            return
          }

          if (nextSession) {
            setSession(nextSession)
            setIsLoading(false)
          }
        },
      )

      return function unsubscribeFromAuthChanges() {
        mounted = false
        unsubscribe()
      }
    },
    [authProvider],
  )

  const signIn = useCallback(
    async function signIn(credentials: AuthCredentials): Promise<AuthSession> {
      const nextSession = await authProvider.signIn(credentials)
      setSession(nextSession)
      return nextSession
    },
    [authProvider],
  )

  const signUp = useCallback(
    async function signUp(credentials: AuthCredentials): Promise<AuthSession | null> {
      const nextSession = await authProvider.signUp(credentials)
      setSession(nextSession)
      return nextSession
    },
    [authProvider],
  )

  const signOut = useCallback(
    async function signOut(): Promise<void> {
      await authProvider.signOut()
      setSession(null)
    },
    [authProvider],
  )

  const requestPasswordReset = useCallback(
    async function requestPasswordReset(
      email: string,
      redirectTo: string,
    ): Promise<void> {
      await authProvider.requestPasswordReset(email, redirectTo)
    },
    [authProvider],
  )

  const updatePassword = useCallback(
    async function updatePassword(password: string): Promise<void> {
      await authProvider.updatePassword(password)
    },
    [authProvider],
  )

  const getSession = useCallback(
    function getSession() {
      return authProvider.getSession()
    },
    [authProvider],
  )

  return useMemo(
    function createAuthValue() {
      return {
        session,
        user: session?.user ?? null,
        isLoading,
        getSession,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        updatePassword,
      }
    },
    [
      isLoading,
      session,
      getSession,
      requestPasswordReset,
      signIn,
      signOut,
      signUp,
      updatePassword,
    ],
  )
}
