import type { ThirdPartyPermission } from '../structures'

export type ThirdPartyPermissionGrant = {
  readonly id: string
  readonly thirdPartyId: string
  readonly permission: ThirdPartyPermission
  readonly active: boolean
  readonly grantedBy: string
  readonly grantedAt: Date
  readonly revokedAt?: Date
}
