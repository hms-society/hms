import type { AuthAdministrationUser, AuthUser } from '../domain/structures'

export interface AuthAdministrationProvider {
  createUser(email: string, password: string): Promise<AuthUser>
  removeUser(userId: string): Promise<void>
  inviteUserByEmail(email: string, redirectTo: string): Promise<AuthUser>
  resendInvitation(email: string, redirectTo: string): Promise<AuthUser>
  findUserByEmail(email: string): Promise<AuthAdministrationUser | undefined>
  setInvitationAttemptId(userId: string, attemptId: string): Promise<void>
  setUserBanned(userId: string, isBanned: boolean): Promise<void>
  revokeSession(accessToken: string): Promise<void>
}
