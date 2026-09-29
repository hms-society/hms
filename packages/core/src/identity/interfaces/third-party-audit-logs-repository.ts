import type { ThirdParty } from '../domain/entities'

export type ThirdPartyAuditLog = {
  readonly actorId: string
  readonly actorProfile: string
  readonly action:
    | 'created'
    | 'deactivated'
    | 'reactivated'
    | 'permission_granted'
    | 'permission_revoked'
  readonly permission?: string
  readonly thirdParty: ThirdParty
}

export interface ThirdPartyAuditLogsRepository {
  create(log: ThirdPartyAuditLog): Promise<void>
}
