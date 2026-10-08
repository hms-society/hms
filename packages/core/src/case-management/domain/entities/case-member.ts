import type { Entity } from '#shared/domain/entities/entity'
import type { CaseMemberLegacyRole, CaseMemberRole } from '../structures'

export type CaseMember = Entity & {
  caseId: string
  collaboratorId: string
  role: CaseMemberRole | CaseMemberLegacyRole
  /** Legacy fields remain available while existing case creation is migrated. */
  permission?: string
  isPrimary?: boolean
  assignedAt: Date
  assignedBy: string
  removedAt?: Date
  removedBy?: string
  archivedLegacy?: boolean
  createdAt: Date
}
