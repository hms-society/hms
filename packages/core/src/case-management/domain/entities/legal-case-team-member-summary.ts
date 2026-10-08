import type { CaseMemberRole, CaseTeamRole } from '../structures'

export type LegalCaseTeamMemberSummary = {
  collaboratorId: string
  name: string
  role: CaseMemberRole | CaseTeamRole
  /** Legacy field retained for summaries produced by older adapters. */
  isPrimary?: boolean
}
