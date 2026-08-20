import type { DynamicForm } from '@hms/core/shared/domain'

import type { DrizzleDynamicForm } from '@/shared/database/drizzle/types/entities'

export class DrizzleDynamicFormMapper {
  toDomain(record: DrizzleDynamicForm): DynamicForm {
    return {
      ...record,
      description: record.description ?? undefined,
    }
  }
}
