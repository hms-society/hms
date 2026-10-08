import type { Entity } from '#shared/domain/entities/entity'
import type {
  CaseEligibilitySnapshot,
  CaseMemberRole,
  CaseTeamRole,
  CaseTeamHistoryKind,
} from '../structures'

export type CaseTeamHistory = Entity & {
  caseId: string
  membershipId: string
  collaboratorId: string
  actorId?: string
  kind: CaseTeamHistoryKind
  occurredAt: Date
  teamVersion: number
  previousRole?: CaseMemberRole | CaseTeamRole
  nextRole?: CaseMemberRole | CaseTeamRole
  previousEligibility?: CaseEligibilitySnapshot
  nextEligibility?: CaseEligibilitySnapshot
  reason?: string
  operationId?: string
  legacy?: {
    readonly role: string
    readonly permission: string
    readonly isPrimary: boolean
    readonly assignedAt: Date
    readonly assignedBy: string
    readonly createdAt: Date
  }
}
