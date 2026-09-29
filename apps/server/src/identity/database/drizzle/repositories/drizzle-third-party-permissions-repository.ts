import { Injectable } from '@nestjs/common'
import type { ThirdPartyPermissionGrant } from '@hms/core/identity/domain/entities'
import type { ThirdPartyPermission } from '@hms/core/identity/domain/structures'
import type { ThirdPartyPermissionsRepository } from '@hms/core/identity/interfaces'
import { and, desc, eq } from 'drizzle-orm'

import { thirdPartyPermissionGrantModel } from '@/identity/database/drizzle/models'
import { DrizzleThirdPartyPermissionGrantMapper } from '@/identity/database/drizzle/mappers'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleThirdPartyPermissionsRepository
  extends DrizzleRepository
  implements ThirdPartyPermissionsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleThirdPartyPermissionGrantMapper,
  ) {
    super(drizzle)
  }

  async listByThirdPartyId(thirdPartyId: string): Promise<ThirdPartyPermissionGrant[]> {
    const records = await this.database
      .select()
      .from(thirdPartyPermissionGrantModel)
      .where(eq(thirdPartyPermissionGrantModel.thirdPartyId, thirdPartyId))
      .orderBy(desc(thirdPartyPermissionGrantModel.grantedAt))

    return records.map((record) => this.mapper.toDomain(record))
  }

  async grant(
    thirdPartyId: string,
    permission: ThirdPartyPermission,
    grantedBy: string,
  ): Promise<ThirdPartyPermissionGrant> {
    const [record] = await this.database
      .insert(thirdPartyPermissionGrantModel)
      .values({ thirdPartyId, permission, active: true, grantedBy })
      .onConflictDoUpdate({
        target: [
          thirdPartyPermissionGrantModel.thirdPartyId,
          thirdPartyPermissionGrantModel.permission,
        ],
        set: { active: true, grantedBy, grantedAt: new Date(), revokedAt: null },
      })
      .returning()

    return this.mapper.toDomain(record)
  }

  async revoke(
    thirdPartyId: string,
    permission: ThirdPartyPermission,
  ): Promise<ThirdPartyPermissionGrant | undefined> {
    const [record] = await this.database
      .update(thirdPartyPermissionGrantModel)
      .set({ active: false, revokedAt: new Date() })
      .where(
        and(
          eq(thirdPartyPermissionGrantModel.thirdPartyId, thirdPartyId),
          eq(thirdPartyPermissionGrantModel.permission, permission),
          eq(thirdPartyPermissionGrantModel.active, true),
        ),
      )
      .returning()

    return record ? this.mapper.toDomain(record) : undefined
  }

  async revokeAll(thirdPartyId: string): Promise<void> {
    await this.database
      .update(thirdPartyPermissionGrantModel)
      .set({ active: false, revokedAt: new Date() })
      .where(
        and(
          eq(thirdPartyPermissionGrantModel.thirdPartyId, thirdPartyId),
          eq(thirdPartyPermissionGrantModel.active, true),
        ),
      )
  }
}
