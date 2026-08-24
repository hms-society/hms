import { Inject, Injectable } from '@nestjs/common'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { and, eq, sql } from 'drizzle-orm'

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

  async findById(caseId: string): ReturnType<LegalCasesRepository['findById']> {
    const [legalCase] = await this.database
      .select()
      .from(legalCaseModel)
      .where(eq(legalCaseModel.id, caseId))
      .limit(1)

    return legalCase ? this.legalCaseMapper.toDomain(legalCase) : undefined
  }

  async reviewChecklistGate({
    caseId,
    checklistGate,
    expectedVersion,
    status,
  }: Parameters<LegalCasesRepository['reviewChecklistGate']>[0]): ReturnType<
    LegalCasesRepository['reviewChecklistGate']
  > {
    const [updatedCase] = await this.database
      .update(legalCaseModel)
      .set({
        checklistGateDecision: checklistGate.decision,
        checklistGateDecidedAt: new Date(),
        checklistGateDecidedBy: checklistGate.decidedBy,
        checklistGateRemarks: checklistGate.remarks,
        status,
        updatedAt: new Date(),
        version: sql`${legalCaseModel.version} + 1`,
      })
      .where(
        and(eq(legalCaseModel.id, caseId), eq(legalCaseModel.version, expectedVersion)),
      )
      .returning()

    return updatedCase ? this.legalCaseMapper.toDomain(updatedCase) : undefined
  }
}
