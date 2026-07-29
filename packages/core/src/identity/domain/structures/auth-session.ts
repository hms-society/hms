import type { AuthUser } from './auth-user'

export type AuthSession = {
  readonly accessToken: string
  readonly refreshToken?: string
  readonly expiresAt?: number
  readonly sessionId?: string
  readonly user: AuthUser
}
