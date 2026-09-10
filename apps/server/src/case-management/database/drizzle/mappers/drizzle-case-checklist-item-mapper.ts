import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'

import type { DrizzleCaseChecklistItem } from '@/case-management/database/drizzle/types'

type DrizzleCaseChecklistItemRecord = DrizzleCaseChecklistItem & {
  checklistTemplateName?: string | null
}

export class DrizzleCaseChecklistItemMapper {
  toDomain(record: DrizzleCaseChecklistItemRecord): CaseChecklistItem {
    return {
      id: record.id,
      caseId: record.caseId,
      templateItemKey: record.templateItemKey,
      checklistTemplateName: record.checklistTemplateName ?? undefined,
      title: record.title,
      isRequired: record.isRequired,
      status: record.status,
      documentFileId: record.documentFileId ?? undefined,
      documentFileName: record.documentFileName ?? undefined,
      validatedAt: record.validatedAt ?? undefined,
      validatedBy: record.validatedBy ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
