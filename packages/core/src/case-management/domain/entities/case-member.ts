import type { Entity } from '#shared/domain/entities/entity'
import type { CaseMemberRole } from '../structures'

export type CaseMember = Entity & {
  caseId: string
  collaboratorId: string
  role: CaseMemberRole
  permission: string
  isPrimary: boolean
  assignedAt: Date
  assignedBy: string
  createdAt: Date
}

export type CaseMemberCreation = Omit<CaseMember, 'createdAt' | 'id'>
