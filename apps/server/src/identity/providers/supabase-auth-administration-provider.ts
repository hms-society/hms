import { Inject, Injectable } from '@nestjs/common'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { AuthAdministrationProvider } from '@hms/core/identity/interfaces'
import type {
  AuthAdministrationUser,
  AuthUser,
} from '@hms/core/identity/domain/structures'
import { AppError, ConflictError } from '@hms/core/shared/domain/errors'

import { EnvProvider } from '@/shared/provision/env/env-provider'

import { isValidSupabaseServerKey } from './is-valid-supabase-server-key'

const INVITATION_ATTEMPT_METADATA_KEY = 'hmsInvitationAttemptId'
const USERS_PAGE_SIZE = 1000
const SUPABASE_LONG_TERM_BAN_DURATION = '876000h'

@Injectable()
export class SupabaseAuthAdministrationProvider implements AuthAdministrationProvider {
  private readonly supabase: SupabaseClient

  constructor(@Inject(EnvProvider) private readonly envProvider: EnvProvider) {
    const supabaseUrl = this.envProvider.get('SUPABASE_URL')
    const serviceRoleKey = this.envProvider.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!serviceRoleKey) {
      throw new AppError(
        'A chave de administração do Supabase é obrigatória para gerenciar o Auth.',
      )
    }

    if (!isValidSupabaseServerKey(serviceRoleKey)) {
      throw new AppError('A chave de administração do Supabase é inválida.')
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async inviteUserByEmail(email: string, redirectTo: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    })

    if (error)
      this.throwAuthError(error, 'Não foi possível enviar o convite para o colaborador.')
    if (!data.user) {
      throw new AppError('O Supabase não retornou o usuário convidado.')
    }

    return this.toAuthUser(data.user)
  }

  async resendInvitation(email: string, redirectTo: string): Promise<AuthUser> {
    return this.inviteUserByEmail(email, redirectTo)
  }

  async createUser(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) this.throwAuthError(error, 'Não foi possível criar o usuário no Auth.')
    if (!data.user) {
      throw new AppError('O Supabase não retornou o usuário criado.')
    }

    return this.toAuthUser(data.user)
  }

  async removeUser(userId: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(userId)

    if (error) this.throwAuthError(error, 'Não foi possível remover o usuário do Auth.')
  }

  async findUserByEmail(email: string): Promise<AuthAdministrationUser | undefined> {
    const normalizedEmail = this.normalizeEmail(email)
    let page = 1

    while (true) {
      const { data, error } = await this.supabase.auth.admin.listUsers({
        page,
        perPage: USERS_PAGE_SIZE,
      })

      if (error) {
        this.throwAuthError(error, 'Não foi possível consultar os usuários do Auth.')
      }

      const user = data.users.find(
        (candidate) =>
          candidate.email && this.normalizeEmail(candidate.email) === normalizedEmail,
      )

      if (user) return this.toAdministrationUser(user)
      if (typeof data.nextPage !== 'number') return undefined

      page = data.nextPage
    }
  }

  async setInvitationAttemptId(userId: string, attemptId: string): Promise<void> {
    const { data: currentUser, error: currentUserError } =
      await this.supabase.auth.admin.getUserById(userId)

    if (currentUserError) {
      this.throwAuthError(
        currentUserError,
        'Não foi possível consultar o usuário no Auth.',
      )
    }
    if (!currentUser.user) {
      throw new AppError('O usuário não foi encontrado no Auth.')
    }

    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...currentUser.user.app_metadata,
        [INVITATION_ATTEMPT_METADATA_KEY]: attemptId,
      },
    })

    if (error) {
      this.throwAuthError(
        error,
        'Não foi possível registrar a tentativa de convite no Auth.',
      )
    }
  }

  async setUserBanned(userId: string, isBanned: boolean): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      ban_duration: isBanned ? SUPABASE_LONG_TERM_BAN_DURATION : 'none',
    })

    if (error) {
      this.throwAuthError(error, 'Não foi possível atualizar o bloqueio do usuário.')
    }
  }

  async revokeSession(accessToken: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.signOut(accessToken, 'local')

    if (error) this.throwAuthError(error, 'Não foi possível revogar a sessão do Auth.')
  }

  private toAdministrationUser(user: User): AuthAdministrationUser {
    const invitationAttemptId = user.app_metadata?.[INVITATION_ATTEMPT_METADATA_KEY]

    return {
      authUserId: user.id,
      email: user.email,
      isConfirmed: Boolean(user.email_confirmed_at),
      ...(typeof invitationAttemptId === 'string' ? { invitationAttemptId } : {}),
    }
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private throwAuthError(error: unknown, fallbackMessage: string): never {
    const authError = this.getAuthError(error)

    if (authError.code === 'email_exists') {
      throw new ConflictError(
        'Este e-mail já possui uma conta no Auth. O colaborador precisa concluir o acesso ou ser reconciliado.',
      )
    }

    throw new AppError(fallbackMessage)
  }

  private getAuthError(error: unknown): { code?: string } {
    if (!error || typeof error !== 'object') return {}

    const candidate = error as { code?: unknown }
    return typeof candidate.code === 'string' ? { code: candidate.code } : {}
  }
}
