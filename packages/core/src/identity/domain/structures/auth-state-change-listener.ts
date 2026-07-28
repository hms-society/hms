import type { AuthSession } from './auth-session'
import type { AuthStateChange } from './auth-state-change'

export type AuthStateChangeListener = (
  event: AuthStateChange,
  session: AuthSession | null,
) => void
