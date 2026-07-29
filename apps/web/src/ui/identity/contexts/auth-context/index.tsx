import { createContext, type PropsWithChildren } from 'react'

import { SupabaseAuthProvider } from '@/provision/auth'
import type { AuthContextValue } from '@/ui/shared/contexts/auth-context/types'
import { useAuthContextProvider } from '@/ui/shared/contexts/auth-context/use-auth-context-provider'

export type AuthContextProviderProps = PropsWithChildren

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const value = useAuthContextProvider(SupabaseAuthProvider())

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
