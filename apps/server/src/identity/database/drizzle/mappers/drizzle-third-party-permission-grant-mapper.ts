import type { ThirdPartyPermissionGrant } from '@hms/core/identity/domain/entities'

import type { DrizzleThirdPartyPermissionGrant } from '@/identity/database/drizzle/types/entities'

export class DrizzleThirdPartyPermissionGrantMapper {
  toDomain(record: DrizzleThirdPartyPermissionGrant): ThirdPartyPermissionGrant {
    return {
      id: record.id,
      thirdPartyId: record.thirdPartyId,
      permission: record.permission,
      active: record.active,
      grantedBy: record.grantedBy,
      grantedAt: record.grantedAt,
      revokedAt: record.revokedAt ?? undefined,
    }
  }
}
