import { Inject, Injectable, Optional } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import type { CaseTeamOperationsRepository } from '@hms/core/case-management/interfaces'
import { caseTeamOperationModel } from '@/case-management/database/drizzle/models'
import { DrizzleCaseTeamOperationMapper } from '@/case-management/database/drizzle/mappers'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { Database } from '@/shared/database/drizzle/drizzle-client'

type CaseManagementDatabaseExecutor = Parameters<
  Parameters<Database['transaction']>[0]
>[0]

@Injectable()
export class DrizzleCaseTeamOperationsRepository
  extends DrizzleRepository
  implements CaseTeamOperationsRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleCaseTeamOperationMapper)
    private readonly mapper: DrizzleCaseTeamOperationMapper,
    @Optional() private readonly executor?: CaseManagementDatabaseExecutor,
  ) {
    super(drizzle)
  }

  protected get database() {
    return this.executor ?? this.drizzleClient.requireDatabase()
  }

  async findByKey(caseId: string, actorId: string, operationId: string) {
    const [record] = await this.database
      .select()
      .from(caseTeamOperationModel)
      .where(
        and(
          eq(caseTeamOperationModel.caseId, caseId),
          eq(caseTeamOperationModel.actorId, actorId),
          eq(caseTeamOperationModel.operationId, operationId),
        ),
      )
      .limit(1)
    return record ? this.mapper.toDomain(record) : undefined
  }

  async add(input: Parameters<CaseTeamOperationsRepository['add']>[0]) {
    const [record] = await this.database
      .insert(caseTeamOperationModel)
      .values(input)
      .returning()
    return this.mapper.toDomain(record)
  }

  async removeAll() {
    await this.database.delete(caseTeamOperationModel)
  }
}
