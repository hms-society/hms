import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import type {
  DynamicFormListItem,
  DynamicFormStage,
} from '@hms/core/legal-catalog/domain/structures'
import { type InferSelectModel } from 'drizzle-orm'

import {
  dynamicFormLegalTopicModel,
  dynamicFormModel,
  legalAreaModel,
  legalTopicModel,
} from '@/legal-catalog/database/drizzle/models'

type DynamicFormRecord = InferSelectModel<typeof dynamicFormModel>
type DynamicFormTopicRecord = InferSelectModel<typeof dynamicFormLegalTopicModel>
type LegalAreaRecord = InferSelectModel<typeof legalAreaModel>
type LegalTopicRecord = InferSelectModel<typeof legalTopicModel>

export class DynamicFormMapper {
  toDomain(
    record: DynamicFormRecord,
    topicRecords: Array<DynamicFormTopicRecord & { topic: LegalTopicRecord | null }>,
  ): DynamicForm {
    return {
      id: record.id,
      name: record.name,
      normalizedName: record.normalizedName,
      description: record.description,
      status: record.status as DynamicForm['status'],
      stage: record.stage as DynamicForm['stage'],
      legalAreaId: record.legalAreaId,
      legalTopicIds: topicRecords
        .sort((left, right) => left.position - right.position)
        .map(({ legalTopicId }) => legalTopicId),
      fields: record.fields,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }

  toListItem(
    record: DynamicFormRecord,
    area: LegalAreaRecord,
    topicRecords: Array<DynamicFormTopicRecord & { topic: LegalTopicRecord | null }>,
  ): DynamicFormListItem {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      status: record.status as DynamicFormListItem['status'],
      stage: record.stage as DynamicFormStage,
      legalArea: { id: area.id, name: area.name },
      legalTopics: topicRecords
        .filter(({ topic }) => topic)
        .sort((left, right) => left.position - right.position)
        .map(({ legalTopicId, position, topic }) => ({
          id: legalTopicId,
          name: topic?.name ?? '',
          position,
        })),
      fieldCount: record.fields.length,
    }
  }
}
