import type {
  AuthCredentials,
  AuthSession,
  AuthStateChangeListener,
  AuthUser,
} from '../domain/structures'

export interface AuthProvider {
  signIn(credentials: AuthCredentials): Promise<AuthSession>
  signUp(credentials: AuthCredentials): Promise<AuthSession | null>
  signOut(): Promise<void>
  getSession(accessToken?: string): Promise<AuthSession | null>
  getUser(accessToken?: string): Promise<AuthUser | null>
  requestPasswordReset(email: string, redirectTo: string): Promise<void>
  updatePassword(password: string): Promise<void>
  onAuthStateChange(listener: AuthStateChangeListener): () => void
}
