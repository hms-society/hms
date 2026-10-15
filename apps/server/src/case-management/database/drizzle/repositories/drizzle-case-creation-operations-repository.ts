import { Inject, Injectable, Optional } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import type { CaseCreationOperationsRepository } from '@hms/core/case-management/interfaces'
import { caseCreationOperationModel } from '@/case-management/database/drizzle/models'
import { DrizzleCaseCreationOperationMapper } from '@/case-management/database/drizzle/mappers'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { Database } from '@/shared/database/drizzle/drizzle-client'

type CaseManagementDatabaseExecutor = Parameters<
  Parameters<Database['transaction']>[0]
>[0]

@Injectable()
export class DrizzleCaseCreationOperationsRepository
  extends DrizzleRepository
  implements CaseCreationOperationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleCaseCreationOperationMapper)
    private readonly mapper: DrizzleCaseCreationOperationMapper,
    @Optional() private readonly executor?: CaseManagementDatabaseExecutor,
  ) {
    super(drizzle)
  }

  protected get database() {
    return this.executor ?? this.drizzleClient.requireDatabase()
  }

  async findByKey(actorId: string, operationId: string) {
    const [record] = await this.database
      .select()
      .from(caseCreationOperationModel)
      .where(
        and(
          eq(caseCreationOperationModel.actorId, actorId),
          eq(caseCreationOperationModel.operationId, operationId),
        ),
      )
      .limit(1)
    return record ? this.mapper.toDomain(record) : undefined
  }

  async add(input: Parameters<CaseCreationOperationsRepository['add']>[0]) {
    const [record] = await this.database
      .insert(caseCreationOperationModel)
      .values(input)
      .returning()
    return this.mapper.toDomain(record)
  }

  async removeAll() {
    await this.database.delete(caseCreationOperationModel)
  }
}
