import type { LegalTopic } from '@hms/core/legal-catalog/domain/entities'

import type { DrizzleLegalTopic } from '@/legal-catalog/database/drizzle/types/entities'

export class DrizzleLegalTopicMapper {
  toDomain(record: DrizzleLegalTopic): LegalTopic {
    return record
  }
}
