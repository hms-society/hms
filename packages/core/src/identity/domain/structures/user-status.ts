export const UserStatus = {
  Invited: 'invited',
  Active: 'active',
  Disabled: 'disabled',
} as const

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]
