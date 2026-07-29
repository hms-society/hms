import { createContext, type PropsWithChildren } from 'react'

import { SupabaseAuthProvider } from '@/provision/auth/supabase/supabase-auth-provider'
import type { AuthContextValue } from './types'
import { useAuthContextProvider } from './use-auth-context-provider'

export type AuthContextProviderProps = PropsWithChildren

export const AuthContext = createContext<AuthContextValue | null>(null)

const AUTH_PROVIDER = SupabaseAuthProvider()

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const value = useAuthContextProvider(AUTH_PROVIDER)

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
