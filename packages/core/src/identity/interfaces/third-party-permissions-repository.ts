import type { ThirdPartyPermissionGrant } from '../domain/entities'
import type { ThirdPartyPermission } from '../domain/structures'

export interface ThirdPartyPermissionsRepository {
  listByThirdPartyId(thirdPartyId: string): Promise<ThirdPartyPermissionGrant[]>
  grant(
    thirdPartyId: string,
    permission: ThirdPartyPermission,
    grantedBy: string,
  ): Promise<ThirdPartyPermissionGrant>
  revoke(
    thirdPartyId: string,
    permission: ThirdPartyPermission,
  ): Promise<ThirdPartyPermissionGrant | undefined>
  revokeAll(thirdPartyId: string): Promise<void>
}
