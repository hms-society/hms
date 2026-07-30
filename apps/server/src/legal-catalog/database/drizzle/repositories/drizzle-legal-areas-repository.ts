import { Inject, Injectable } from '@nestjs/common'
import type { LegalAreaCreation } from '@hms/core/legal-catalog/domain/entities'
import type { LegalAreasRepository } from '@hms/core/legal-catalog/interfaces'
import { asc, eq } from 'drizzle-orm'

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

  async findActive() {
    const records = await this.database
      .select()
      .from(legalAreaModel)
      .where(eq(legalAreaModel.active, true))
      .orderBy(asc(legalAreaModel.name))

    return records.map((record) => this.legalAreaMapper.toDomain(record))
  }

  async removeAll() {
    await this.database.delete(legalAreaModel)
  }
}
