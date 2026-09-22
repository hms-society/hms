import type { CasePortalAccessGrant } from '@hms/core/case-management/domain/entities'
import type { InferSelectModel } from 'drizzle-orm'

import { casePortalAccessGrantModel } from '@/case-management/database/drizzle/models/case-portal-access-grant-model'

type Record = InferSelectModel<typeof casePortalAccessGrantModel>

export class DrizzleCasePortalAccessGrantMapper {
  toDomain(record: Record): CasePortalAccessGrant {
    return {
      id: record.id,
      caseId: record.caseId,
      userId: record.userId,
      canView: Boolean(record.canView),
      canUpload: Boolean(record.canUpload),
      status: record.status,
      expiresAt: record.expiresAt ?? undefined,
      grantedBy: record.grantedBy,
      revokedAt: record.revokedAt ?? undefined,
      createdAt: record.createdAt,
    }
  }
}
