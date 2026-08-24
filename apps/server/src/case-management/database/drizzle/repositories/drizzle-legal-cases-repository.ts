import { Inject, Injectable } from '@nestjs/common'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'

import { DrizzleLegalCaseMapper } from '@/case-management/database/drizzle/mappers'
import { legalCaseModel } from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleLegalCasesRepository
  extends DrizzleRepository
  implements LegalCasesRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleLegalCaseMapper)
    private readonly legalCaseMapper: DrizzleLegalCaseMapper,
  ) {
    super(drizzle)
  }

  async addMany(
    legalCases: Parameters<LegalCasesRepository['addMany']>[0],
  ): ReturnType<LegalCasesRepository['addMany']> {
    if (legalCases.length === 0) return []

    const createdLegalCases = await this.database
      .insert(legalCaseModel)
      .values([...legalCases])
      .returning()

    return createdLegalCases.map((legalCase) => this.legalCaseMapper.toDomain(legalCase))
  }

  async removeAll(): Promise<void> {
    await this.database.delete(legalCaseModel)
  }
}
