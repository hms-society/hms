import { Inject, Injectable, Optional } from '@nestjs/common'
import { desc, eq, sql } from 'drizzle-orm'
import type { CaseTeamHistoriesRepository } from '@hms/core/case-management/interfaces'
import { PaginationResponse } from '@hms/core/shared/responses/pagination-response'
import { caseTeamHistoryModel } from '@/case-management/database/drizzle/models'
import { DrizzleCaseTeamHistoryMapper } from '@/case-management/database/drizzle/mappers'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { Database } from '@/shared/database/drizzle/drizzle-client'

type CaseManagementDatabaseExecutor = Parameters<
  Parameters<Database['transaction']>[0]
>[0]

@Injectable()
export class DrizzleCaseTeamHistoriesRepository
  extends DrizzleRepository
  implements CaseTeamHistoriesRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleCaseTeamHistoryMapper)
    private readonly mapper: DrizzleCaseTeamHistoryMapper,
    @Optional() private readonly executor?: CaseManagementDatabaseExecutor,
  ) {
    super(drizzle)
  }

  protected get database() {
    return this.executor ?? this.drizzleClient.requireDatabase()
  }

  async add(input: Parameters<CaseTeamHistoriesRepository['add']>[0]) {
    const [created] = await this.database
      .insert(caseTeamHistoryModel)
      .values(input)
      .returning()
    return this.mapper.toDomain(created)
  }

  async listByCaseId(caseId: string, query: { page: number; pageSize: number }) {
    const [{ total }] = await this.database
      .select({ total: sql<number>`cast(count(*) as integer)` })
      .from(caseTeamHistoryModel)
      .where(eq(caseTeamHistoryModel.caseId, caseId))
    const items = await this.database
      .select()
      .from(caseTeamHistoryModel)
      .where(eq(caseTeamHistoryModel.caseId, caseId))
      .orderBy(desc(caseTeamHistoryModel.occurredAt), desc(caseTeamHistoryModel.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)
    return new PaginationResponse(
      items.map((item) => this.mapper.toDomain(item)),
      query.page,
      query.pageSize,
      total,
      Math.ceil(total / query.pageSize),
    )
  }

  async removeAll() {
    await this.database.delete(caseTeamHistoryModel)
  }
}
