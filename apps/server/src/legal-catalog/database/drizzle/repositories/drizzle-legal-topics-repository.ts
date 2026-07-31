import { Inject, Injectable } from '@nestjs/common'
import type { LegalTopicCreation } from '@hms/core/legal-catalog/domain/entities'
import type { LegalTopicsRepository } from '@hms/core/legal-catalog/interfaces'
import { and, asc, eq, inArray } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { legalAreaModel, legalTopicModel } from '@/legal-catalog/database/drizzle/models'
import { DrizzleLegalTopicMapper } from '@/legal-catalog/database/drizzle/mappers'

@Injectable()
export class DrizzleLegalTopicsRepository
  extends DrizzleRepository
  implements LegalTopicsRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleLegalTopicMapper)
    private readonly legalTopicMapper: DrizzleLegalTopicMapper,
  ) {
    super(drizzle)
  }

  async addMany(topics: LegalTopicCreation[]) {
    if (topics.length === 0) return []

    const records = await this.database.insert(legalTopicModel).values(topics).returning()
    return records.map((record) => this.legalTopicMapper.toDomain(record))
  }

  async findActiveByLegalAreaId(legalAreaId: string) {
    const records = await this.database
      .select({ topic: legalTopicModel })
      .from(legalTopicModel)
      .innerJoin(legalAreaModel, eq(legalTopicModel.legalAreaId, legalAreaModel.id))
      .where(
        and(
          eq(legalTopicModel.legalAreaId, legalAreaId),
          eq(legalTopicModel.active, true),
          eq(legalAreaModel.active, true),
        ),
      )
      .orderBy(asc(legalTopicModel.name))

    return records.map(({ topic }) => this.legalTopicMapper.toDomain(topic))
  }

  async findByIds(legalTopicIds: readonly string[]) {
    if (legalTopicIds.length === 0) return []

    const records = await this.database
      .select()
      .from(legalTopicModel)
      .where(inArray(legalTopicModel.id, legalTopicIds))

    return records.map((record) => this.legalTopicMapper.toDomain(record))
  }

  async removeAll() {
    await this.database.delete(legalTopicModel)
  }
}
