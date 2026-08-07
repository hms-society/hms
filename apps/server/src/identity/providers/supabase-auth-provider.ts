import { Inject, Injectable } from '@nestjs/common'
import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'
import type { AuthProvider } from '@hms/core/identity/interfaces'
import { InvalidCredentialsError } from '@hms/core/identity/domain/errors'
import { AppError } from '@hms/core/shared/domain/errors'
import type {
  AuthCredentials,
  AuthSession,
  AuthStateChange,
  AuthStateChangeListener,
  AuthUser,
} from '@hms/core/identity/domain/structures'

import { EnvProvider } from '@/shared/provision/env/env-provider'

import { isValidSupabaseServerKey } from './is-valid-supabase-server-key'

@Injectable()
export class SupabaseAuthProvider implements AuthProvider {
  private readonly supabase: SupabaseClient

  constructor(@Inject(EnvProvider) private readonly envProvider: EnvProvider) {
    const supabaseUrl = this.envProvider.get('SUPABASE_URL')
    const supabaseKey = this.envProvider.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY is required to use Supabase Auth',
      )
    }

    if (!isValidSupabaseServerKey(supabaseKey)) {
      throw new Error('Supabase server key must be a legacy JWT or an sb_secret key')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  }

  async signIn({ identifier, password }: AuthCredentials): Promise<AuthSession> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: identifier,
      password,
    })

    if (error || !data.session) this.handleSignInError(error)

    return this.toSession(data.session)
  }

  async signUp({ identifier, password }: AuthCredentials): Promise<AuthSession | null> {
    const { data, error } = await this.supabase.auth.signUp({
      email: identifier,
      password,
    })

    if (error) throw error
    return data.session ? this.toSession(data.session) : null
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async getSession(accessToken?: string): Promise<AuthSession | null> {
    if (accessToken) return this.getSessionFromAccessToken(accessToken)

    const { data, error } = await this.supabase.auth.getSession()
    if (error || !data.session) return null
    return this.toSession(data.session)
  }

  async getUser(accessToken?: string): Promise<AuthUser | null> {
    const session = await this.getSession(accessToken)
    return session?.user ?? null
  }

  async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    if (error) throw error
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password })
    if (error) throw error
  }

  onAuthStateChange(listener: AuthStateChangeListener): () => void {
    const { data } = this.supabase.auth.onAuthStateChange((event, session) => {
      listener(event as AuthStateChange, session ? this.toSession(session) : null)
    })

    return () => data.subscription.unsubscribe()
  }

  private async getSessionFromAccessToken(
    accessToken: string,
  ): Promise<AuthSession | null> {
    const { data, error } = await this.supabase.auth.getUser(accessToken)
    if (error || !data.user) return null

    return {
      accessToken,
      sessionId: this.getSessionId(accessToken),
      user: this.toUser(data.user),
    }
  }

  private toSession(session: Session): AuthSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      sessionId: this.getSessionId(session.access_token),
      user: this.toUser(session.user),
    }
  }

  private toUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role,
      ...(user.invited_at ? { invitedAt: user.invited_at } : {}),
    }
  }

  private getSessionId(accessToken: string): string | undefined {
    try {
      const [, encodedPayload] = accessToken.split('.')
      if (!encodedPayload) return undefined

      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as { session_id?: unknown }

      return typeof payload.session_id === 'string' ? payload.session_id : undefined
    } catch {
      return undefined
    }
  }

  private handleSignInError(error: unknown): never {
    if (this.isInvalidCredentialsError(error)) {
      throw new InvalidCredentialsError()
    }

    throw new AppError('Não foi possível concluir a autenticação.')
  }

  private isInvalidCredentialsError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return true

    const authError = error as { code?: unknown; status?: unknown }
    return authError.code === 'invalid_credentials' || authError.status === 400
  }
}
