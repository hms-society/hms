import { Injectable } from '@nestjs/common'
import type {
  CaseTask,
  CaseTaskReminder,
} from '@hms/core/case-management/domain/entities'
import type {
  CaseTaskSource,
  CaseTaskStatus,
  CaseTaskType,
} from '@hms/core/case-management/domain/structures'

import type {
  DrizzleCaseTask,
  DrizzleCaseTaskReminder,
} from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleCaseTaskMapper {
  toDomain(
    record: DrizzleCaseTask,
    assigneeIds: readonly string[] = [],
    reminders: readonly CaseTaskReminder[] = [],
  ): CaseTask {
    return {
      ...record,
      type: record.type as CaseTaskType,
      status: record.status as CaseTaskStatus,
      source: record.source as CaseTaskSource,
      customType: record.customType ?? undefined,
      plannedTime: record.plannedTime ?? undefined,
      completedAt: record.completedAt ?? undefined,
      completedById: record.completedById ?? undefined,
      deletedAt: record.deletedAt ?? undefined,
      completionNote: record.completionNote ?? undefined,
      lastReminderAt: record.lastReminderAt ?? undefined,
      assigneeIds,
      reminders,
    }
  }

  toReminderDomain(record: DrizzleCaseTaskReminder): CaseTaskReminder {
    return {
      id: record.id,
      value: record.value,
      unit: record.unit as 'minutes' | 'hours' | 'days',
      sentAt: record.sentAt ?? undefined,
      createdAt: record.createdAt,
    }
  }
}
