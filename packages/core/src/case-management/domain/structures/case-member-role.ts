export const CaseMemberRole = {
  Manager: 'manager',
  Collaborator: 'collaborator',
} as const

export type CaseMemberRole = (typeof CaseMemberRole)[keyof typeof CaseMemberRole]
