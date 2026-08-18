import { Injectable } from '@nestjs/common'
import type { LegalCase } from '@hms/core/case-management/domain/entities'

import type { DrizzleLegalCase } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleLegalCaseMapper {
  toDomain(record: DrizzleLegalCase): LegalCase {
    return record
  }
}
