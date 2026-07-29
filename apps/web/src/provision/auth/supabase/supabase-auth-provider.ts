import type { AuthProvider } from '@hms/core/identity/interfaces'
import type {
  AuthCredentials,
  AuthSession,
  AuthStateChange,
  AuthStateChangeListener,
  AuthUser,
} from '@hms/core/identity/domain/structures'
import {
  type AuthError,
  type Session,
  type SupabaseClient,
  type User,
  isAuthError,
} from '@supabase/supabase-js'

import { supabaseClient } from './supabase-client'
import { AppError, BadRequestError, ConflictError } from '@hms/core/shared/domain/errors'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_address_invalid: 'Informe um endereço de email válido.',
  email_exists: 'Já existe uma conta cadastrada com este email.',
  email_not_confirmed: 'Confirme seu email antes de entrar.',
  invalid_credentials: 'Email ou senha inválidos.',
  user_already_exists: 'Já existe uma conta cadastrada com este email.',
  user_banned: 'Esta conta está bloqueada.',
  weak_password: 'A senha informada não atende aos requisitos mínimos.',
}

export const SupabaseAuthProvider = (
  client: SupabaseClient = supabaseClient,
): AuthProvider => {
  return {
    async createUser({ identifier, password }: AuthCredentials): Promise<AuthUser> {
      const { data, error } = await client.auth.signUp({
        email: identifier,
        password,
      })

      if (error) throwDomainAuthError(error)

      if (!data.user) throw new AppError('Supabase did not create the user')

      return toUser(data.user)
    },

    async signIn({ identifier, password }: AuthCredentials): Promise<AuthSession> {
      const { data, error } = await client.auth.signInWithPassword({
        email: identifier,
        password,
      })

      if (error) throwDomainAuthError(error)

      if (!data.session)
        throw new AppError('Supabase did not create an authentication session')

      return toSession(data.session)
    },

    async signUp({ identifier, password }: AuthCredentials): Promise<AuthSession | null> {
      const { data, error } = await client.auth.signUp({
        email: identifier,
        password,
      })

      if (error) throwDomainAuthError(error)

      return data.session ? toSession(data.session) : null
    },

    async signOut(): Promise<void> {
      const { error } = await client.auth.signOut()

      if (error) throwDomainAuthError(error)
    },

    async getSession(accessToken?: string): Promise<AuthSession | null> {
      if (accessToken) {
        const { data, error } = await client.auth.getUser(accessToken)

        if (error) {
          if (error.code === 'session_not_found') return null

          throwDomainAuthError(error)
        }

        if (!data.user) return null

        return {
          accessToken,
          user: toUser(data.user),
        }
      }

      const { data, error } = await client.auth.getSession()

      if (error) {
        if (error.code === 'session_not_found') return null

        throwDomainAuthError(error)
      }

      if (!data.session) return null

      return toSession(data.session)
    },

    async getUser(accessToken?: string): Promise<AuthUser | null> {
      if (accessToken) {
        const { data, error } = await client.auth.getUser(accessToken)

        if (error) {
          if (error.code === 'session_not_found') return null

          throwDomainAuthError(error)
        }

        if (!data.user) return null

        return toUser(data.user)
      }

      const { data, error } = await client.auth.getUser()

      if (error) {
        if (error.code === 'session_not_found') return null

        throwDomainAuthError(error)
      }

      if (!data.user) return null

      return toUser(data.user)
    },

    async requestPasswordReset(email: string, redirectTo: string): Promise<void> {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) throwDomainAuthError(error)
    },

    async updatePassword(password: string): Promise<void> {
      const { error } = await client.auth.updateUser({ password })

      if (error) throwDomainAuthError(error)
    },

    onAuthStateChange(listener: AuthStateChangeListener): () => void {
      const { data } = client.auth.onAuthStateChange((event, session) => {
        listener(event as AuthStateChange, session ? toSession(session) : null)
      })

      return () => data.subscription.unsubscribe()
    },
  }
}

function throwDomainAuthError(error: AuthError): never {
  if (!isAuthError(error)) {
    throw new AppError('Não foi possível concluir a operação de autenticação.')
  }

  const message =
    (error.code && AUTH_ERROR_MESSAGES[error.code]) ??
    'Não foi possível concluir a operação de autenticação.'

  if (error.code === 'email_exists' || error.code === 'user_already_exists') {
    throw new ConflictError(message)
  }

  if (error.status !== undefined && error.status < 500) {
    throw new BadRequestError(message)
  }

  throw new AppError(message)
}

function toSession(session: Session): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    user: toUser(session.user),
  }
}

function toUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role,
  }
}
