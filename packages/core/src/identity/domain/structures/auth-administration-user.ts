export type AuthAdministrationUser = {
  readonly authUserId: string
  readonly email?: string
  readonly isConfirmed: boolean
  readonly invitationAttemptId?: string
}
