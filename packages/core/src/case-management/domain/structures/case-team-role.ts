export const CaseTeamRole = {
  Manager: 'manager',
  Collaborator: 'collaborator',
} as const

export type CaseTeamRole = (typeof CaseTeamRole)[keyof typeof CaseTeamRole]
