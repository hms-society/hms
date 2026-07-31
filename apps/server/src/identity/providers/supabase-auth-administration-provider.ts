import { Inject, Injectable } from '@nestjs/common'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { AuthAdministrationProvider } from '@hms/core/identity/interfaces'
import type {
  AuthAdministrationUser,
  AuthUser,
} from '@hms/core/identity/domain/structures'

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
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for Auth administration')
    }

    if (!isValidSupabaseServerKey(serviceRoleKey)) {
      throw new Error('Supabase server key must be a legacy JWT or an sb_secret key')
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async inviteUserByEmail(email: string, redirectTo: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    })

    if (error || !data.user) {
      throw error ?? new Error('Supabase did not create the invited user')
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

    if (error || !data.user) {
      throw error ?? new Error('Supabase did not create the user')
    }

    return this.toAuthUser(data.user)
  }

  async removeUser(userId: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(userId)

    if (error) throw error
  }

  async findUserByEmail(email: string): Promise<AuthAdministrationUser | undefined> {
    const normalizedEmail = this.normalizeEmail(email)
    let page = 1

    while (true) {
      const { data, error } = await this.supabase.auth.admin.listUsers({
        page,
        perPage: USERS_PAGE_SIZE,
      })

      if (error) throw error

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

    if (currentUserError || !currentUser.user) {
      throw currentUserError ?? new Error('Supabase user was not found')
    }

    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...currentUser.user.app_metadata,
        [INVITATION_ATTEMPT_METADATA_KEY]: attemptId,
      },
    })

    if (error) throw error
  }

  async setUserBanned(userId: string, isBanned: boolean): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      ban_duration: isBanned ? SUPABASE_LONG_TERM_BAN_DURATION : 'none',
    })

    if (error) throw error
  }

  async revokeSession(accessToken: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.signOut(accessToken, 'local')

    if (error) throw error
  }

  private toAdministrationUser(user: User): AuthAdministrationUser {
    const invitationAttemptId = user.app_metadata?.[INVITATION_ATTEMPT_METADATA_KEY]

    return {
      authUserId: user.id,
      email: user.email,
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
}
