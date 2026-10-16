import { Injectable } from '@nestjs/common'
import type { CaseCreationOperation } from '@hms/core/case-management/domain/entities'
import type { DrizzleCaseCreationOperation } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleCaseCreationOperationMapper {
  toDomain(record: DrizzleCaseCreationOperation): CaseCreationOperation {
    return {
      ...record,
      result: {
        ...record.result,
        openedAt: new Date(record.result.openedAt),
        createdAt: new Date(record.result.createdAt),
        updatedAt: new Date(record.result.updatedAt),
      },
    }
  }
}
