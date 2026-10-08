import { Injectable } from '@nestjs/common'
import type { CaseTeamOperation } from '@hms/core/case-management/domain/entities'
import type { DrizzleCaseTeamOperation } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleCaseTeamOperationMapper {
  toDomain(record: DrizzleCaseTeamOperation): CaseTeamOperation {
    return record
  }
}
