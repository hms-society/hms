export const ThirdPartyStatus = {
  Active: 'active',
  Inactive: 'inactive',
} as const

export type ThirdPartyStatus = (typeof ThirdPartyStatus)[keyof typeof ThirdPartyStatus]
