export const CasePortalAccessGrantStatus = {
  Active: 'active',
  Revoked: 'revoked',
} as const

export type CasePortalAccessGrantStatus =
  (typeof CasePortalAccessGrantStatus)[keyof typeof CasePortalAccessGrantStatus]
