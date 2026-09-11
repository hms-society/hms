import { Inject, Injectable } from '@nestjs/common'
import type {
  LegalAreaCreation,
  LegalAreaUpdate,
} from '@hms/core/legal-catalog/domain/entities'
import type { LegalAreasRepository } from '@hms/core/legal-catalog/interfaces'
import { asc, eq, inArray, sql } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { legalAreaModel } from '@/legal-catalog/database/drizzle/models'
import { DrizzleLegalAreaMapper } from '@/legal-catalog/database/drizzle/mappers'

@Injectable()
export class DrizzleLegalAreasRepository
  extends DrizzleRepository
  implements LegalAreasRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleLegalAreaMapper)
    private readonly legalAreaMapper: DrizzleLegalAreaMapper,
  ) {
    super(drizzle)
  }

  async addMany(areas: LegalAreaCreation[]) {
    if (areas.length === 0) return []

    const records = await this.database.insert(legalAreaModel).values(areas).returning()
    return records.map((record) => this.legalAreaMapper.toDomain(record))
  }

  async findAll() {
    const records = await this.database
      .select()
      .from(legalAreaModel)
      .orderBy(asc(legalAreaModel.name))

    return records.map((record) => this.legalAreaMapper.toDomain(record))
  }

  async findActive() {
    const records = await this.database
      .select()
      .from(legalAreaModel)
      .where(eq(legalAreaModel.active, true))
      .orderBy(asc(legalAreaModel.name))

    return records.map((record) => this.legalAreaMapper.toDomain(record))
  }

  async findById(legalAreaId: string) {
    const [record] = await this.database
      .select()
      .from(legalAreaModel)
      .where(eq(legalAreaModel.id, legalAreaId))
      .limit(1)

    return record ? this.legalAreaMapper.toDomain(record) : undefined
  }

  async findByName(name: string) {
    const [record] = await this.database
      .select()
      .from(legalAreaModel)
      .where(sql`lower(btrim(${legalAreaModel.name})) = lower(btrim(${name}))`)
      .limit(1)

    return record ? this.legalAreaMapper.toDomain(record) : undefined
  }

  async findByIds(legalAreaIds: readonly string[]) {
    if (legalAreaIds.length === 0) return []

    const records = await this.database
      .select()
      .from(legalAreaModel)
      .where(inArray(legalAreaModel.id, legalAreaIds))

    return records.map((record) => this.legalAreaMapper.toDomain(record))
  }

  async replace(legalAreaId: string, changes: LegalAreaUpdate) {
    const [record] = await this.database
      .update(legalAreaModel)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(legalAreaModel.id, legalAreaId))
      .returning()

    return record ? this.legalAreaMapper.toDomain(record) : undefined
  }

  async removeAll() {
    await this.database.delete(legalAreaModel)
  }
}
