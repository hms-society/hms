import type {
  CaseMemberLegacyRole,
  CaseMemberRole,
} from '../structures'

export type LegalCaseTeamMemberSummary = {
  collaboratorId: string
  name: string
  role: CaseMemberRole | CaseMemberLegacyRole
  /** Legacy field retained for summaries produced by older adapters. */
  isPrimary?: boolean
}
