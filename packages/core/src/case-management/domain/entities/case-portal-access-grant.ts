import type { Entity } from '#shared/domain/entities/entity'
import type { CasePortalAccessGrantStatus } from '../structures'

export type CasePortalAccessGrant = Entity & {
  caseId: string
  userId: string
  canView: boolean
  canUpload: boolean
  status: CasePortalAccessGrantStatus
  expiresAt?: Date
  grantedBy: string
  revokedAt?: Date
  createdAt: Date
}

export type CasePortalAccessGrantCreation = Omit<
  CasePortalAccessGrant,
  'createdAt' | 'id' | 'revokedAt' | 'status'
>
