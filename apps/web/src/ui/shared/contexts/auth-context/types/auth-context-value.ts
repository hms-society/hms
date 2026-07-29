import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
} from '@hms/core/identity/domain/structures'

export type AuthContextValue = {
  session: AuthSession | null
  user: AuthUser | null
  isLoading: boolean
  getSession: () => Promise<AuthSession | null>
  signIn: (credentials: AuthCredentials) => Promise<AuthSession>
  signUp: (credentials: AuthCredentials) => Promise<AuthSession | null>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string, redirectTo: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}
