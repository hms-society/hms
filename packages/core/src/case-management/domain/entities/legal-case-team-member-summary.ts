import type { CaseMemberRole } from '../structures'

export type LegalCaseTeamMemberSummary = {
  collaboratorId: string
  name: string
  role: CaseMemberRole
  /** Legacy field retained for summaries produced by older adapters. */
  isPrimary?: boolean
}
