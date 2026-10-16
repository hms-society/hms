import { Injectable } from '@nestjs/common'
import type { CaseClosureEvent } from '@hms/core/case-management/domain/entities'

import type { DrizzleCaseClosureEvent } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleCaseClosureEventMapper {
  toDomain(record: DrizzleCaseClosureEvent): CaseClosureEvent {
    return {
      id: record.id,
      caseId: record.caseId,
      type: record.type,
      actorId: record.actorId,
      occurredAt: record.occurredAt,
      outcome: record.outcome ?? undefined,
      notes: record.notes ?? undefined,
      reason: record.reason ?? undefined,
    }
  }
}
