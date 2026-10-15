export const CaseTeamHistoryKind = {
  Added: 'added',
  Removed: 'removed',
  RoleChanged: 'role_changed',
  EligibilityChanged: 'eligibility_changed',
  LegacyImported: 'legacy_imported',
} as const

export type CaseTeamHistoryKind = (typeof CaseTeamHistoryKind)[keyof typeof CaseTeamHistoryKind]
