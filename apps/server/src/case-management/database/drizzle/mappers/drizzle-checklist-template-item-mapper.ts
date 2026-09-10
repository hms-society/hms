import { Injectable } from '@nestjs/common'
import type { ChecklistTemplateItem } from '@hms/core/case-management/domain/entities'
import { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'

import type { DrizzleChecklistTemplateItem } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleChecklistTemplateItemMapper {
  toDomain(record: DrizzleChecklistTemplateItem): ChecklistTemplateItem {
    return {
      id: record.id,
      checklistTemplateId: record.checklistTemplateId,
      title: record.title,
      documentTypes: parseChecklistDocumentTypes(record.documentType),
      isRequired: record.isRequired,
      position: record.position,
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy ?? undefined,
    }
  }
}

export function parseChecklistDocumentTypes(
  documentType: string,
): ChecklistTemplateItem['documentTypes'] {
  const documentTypes = documentType
    .split(',')
    .map((value) => value.trim())
    .filter(isChecklistDocumentType)

  if (documentTypes.length === 0 || documentTypes.includes(ChecklistDocumentType.Any)) {
    return [ChecklistDocumentType.Any]
  }

  return [...new Set(documentTypes)]
}

export function serializeChecklistDocumentTypes(
  documentTypes: readonly ChecklistDocumentType[],
): string {
  if (documentTypes.includes(ChecklistDocumentType.Any)) {
    return ChecklistDocumentType.Any
  }

  return [...new Set(documentTypes)].join(',')
}

function isChecklistDocumentType(value: string): value is ChecklistDocumentType {
  return Object.values(ChecklistDocumentType).includes(value as ChecklistDocumentType)
}
