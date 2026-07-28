import type { LegalArea } from '@hms/core/legal-catalog/domain/entities'

import type { DrizzleLegalArea } from '@/legal-catalog/database/drizzle/types/entities'

export class DrizzleLegalAreaMapper {
  toDomain(record: DrizzleLegalArea): LegalArea {
    return record
  }
}
