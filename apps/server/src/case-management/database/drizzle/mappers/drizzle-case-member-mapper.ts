import { Injectable } from '@nestjs/common'
import type { CaseMember } from '@hms/core/case-management/domain/entities'

import type { DrizzleCaseMember } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleCaseMemberMapper {
  toDomain(record: DrizzleCaseMember): CaseMember {
    return record
  }
}
