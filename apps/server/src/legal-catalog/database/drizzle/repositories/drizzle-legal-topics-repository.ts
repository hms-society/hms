import { Inject, Injectable } from '@nestjs/common'
import type {
  LegalTopicCreation,
  LegalTopicUpdate,
} from '@hms/core/legal-catalog/domain/entities'
import type { LegalTopicsRepository } from '@hms/core/legal-catalog/interfaces'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'

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

  async findAllByLegalAreaId(legalAreaId: string) {
    const records = await this.database
      .select()
      .from(legalTopicModel)
      .where(eq(legalTopicModel.legalAreaId, legalAreaId))
      .orderBy(asc(legalTopicModel.name))

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

  async findById(legalTopicId: string) {
    const [record] = await this.database
      .select()
      .from(legalTopicModel)
      .where(eq(legalTopicModel.id, legalTopicId))
      .limit(1)

    return record ? this.legalTopicMapper.toDomain(record) : undefined
  }

  async findByLegalAreaIdAndName(legalAreaId: string, name: string) {
    const [record] = await this.database
      .select()
      .from(legalTopicModel)
      .where(
        and(
          eq(legalTopicModel.legalAreaId, legalAreaId),
          sql`lower(btrim(${legalTopicModel.name})) = lower(btrim(${name}))`,
        ),
      )
      .limit(1)

    return record ? this.legalTopicMapper.toDomain(record) : undefined
  }

  async findByIds(legalTopicIds: readonly string[]) {
    if (legalTopicIds.length === 0) return []

    const records = await this.database
      .select()
      .from(legalTopicModel)
      .where(inArray(legalTopicModel.id, legalTopicIds))

    return records.map((record) => this.legalTopicMapper.toDomain(record))
  }

  async replace(legalTopicId: string, changes: LegalTopicUpdate) {
    const [record] = await this.database
      .update(legalTopicModel)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(legalTopicModel.id, legalTopicId))
      .returning()

    return record ? this.legalTopicMapper.toDomain(record) : undefined
  }

  async removeAll() {
    await this.database.delete(legalTopicModel)
  }
}
