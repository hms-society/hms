import { Injectable } from '@nestjs/common'
import type { CaseTeamHistory } from '@hms/core/case-management/domain/entities'
import type { DrizzleCaseTeamHistory } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleCaseTeamHistoryMapper {
  toDomain(record: DrizzleCaseTeamHistory): CaseTeamHistory {
    return {
      ...record,
      actorId: record.actorId ?? undefined,
      operationId: record.operationId ?? undefined,
      previousRole: record.previousRole ?? undefined,
      nextRole: record.nextRole ?? undefined,
      previousEligibility: record.previousEligibility ?? undefined,
      nextEligibility: record.nextEligibility ?? undefined,
      reason: record.reason ?? undefined,
      legacy: record.legacy
        ? {
            ...record.legacy,
            assignedAt: new Date(record.legacy.assignedAt),
            createdAt: new Date(record.legacy.createdAt),
          }
        : undefined,
    }
  }
}
