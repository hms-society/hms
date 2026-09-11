import { Injectable } from '@nestjs/common'
import type { ChecklistTemplate } from '@hms/core/case-management/domain/entities'

import type { DrizzleChecklistTemplate } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleChecklistTemplateMapper {
  toDomain(record: DrizzleChecklistTemplate): ChecklistTemplate {
    return {
      id: record.id,
      legalAreaId: record.legalAreaId,
      name: record.name,
      isActive: record.isActive,
      items: [],
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy ?? undefined,
    }
  }
}
