import { Injectable } from '@nestjs/common'
import { CasePortalAccessGrantStatus } from '@hms/core/case-management/domain/structures'
import type { CasePortalAccessGrantsRepository } from '@hms/core/case-management/interfaces'
import { and, eq, gt, isNull, or } from 'drizzle-orm'

import { DrizzleCasePortalAccessGrantMapper } from '@/case-management/database/drizzle/mappers/drizzle-case-portal-access-grant-mapper'
import { casePortalAccessGrantModel } from '@/case-management/database/drizzle/models/case-portal-access-grant-model'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleCasePortalAccessGrantsRepository
  extends DrizzleRepository
  implements CasePortalAccessGrantsRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: DrizzleCasePortalAccessGrantMapper,
  ) {
    super(drizzle)
  }

  async add(
    grant: Parameters<CasePortalAccessGrantsRepository['add']>[0],
  ): ReturnType<CasePortalAccessGrantsRepository['add']> {
    const [created] = await this.database
      .insert(casePortalAccessGrantModel)
      .values(grant)
      .returning()

    return this.mapper.toDomain(created)
  }

  async findActiveByUserAndCase(
    userId: string,
    caseId: string,
  ): ReturnType<CasePortalAccessGrantsRepository['findActiveByUserAndCase']> {
    const now = new Date()
    const [grant] = await this.database
      .select()
      .from(casePortalAccessGrantModel)
      .where(
        and(
          eq(casePortalAccessGrantModel.userId, userId),
          eq(casePortalAccessGrantModel.caseId, caseId),
          eq(casePortalAccessGrantModel.status, CasePortalAccessGrantStatus.Active),
          or(isNull(casePortalAccessGrantModel.expiresAt), gt(casePortalAccessGrantModel.expiresAt, now)),
          eq(casePortalAccessGrantModel.canView, true),
        ),
      )
      .limit(1)

    return grant ? this.mapper.toDomain(grant) : undefined
  }

  async revoke(
    grantId: string,
    caseId: string,
  ): ReturnType<CasePortalAccessGrantsRepository['revoke']> {
    const [revoked] = await this.database
      .update(casePortalAccessGrantModel)
      .set({ status: CasePortalAccessGrantStatus.Revoked, revokedAt: new Date() })
      .where(
        and(
          eq(casePortalAccessGrantModel.id, grantId),
          eq(casePortalAccessGrantModel.caseId, caseId),
        ),
      )
      .returning()

    return revoked ? this.mapper.toDomain(revoked) : undefined
  }

  async removeAll(): Promise<void> {
    await this.database.delete(casePortalAccessGrantModel)
  }
}
