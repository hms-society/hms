import type { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import type {
  CaseEligibleCollaborator,
  CaseTeamMember,
} from '@hms/core/case-management/domain/structures'

export type PendingMutation =
  | { kind: 'add'; candidate: CaseEligibleCollaborator; role: CaseMemberRole }
  | { kind: 'role'; member: CaseTeamMember; role: CaseMemberRole }
  | { kind: 'remove'; member: CaseTeamMember }
