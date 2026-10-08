import { Inject, Injectable, Optional } from '@nestjs/common'
import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { and, desc, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm'

import { DrizzleLegalCaseMapper } from '@/case-management/database/drizzle/mappers'
import {
  caseMemberModel,
  legalCaseModel,
} from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import type { Database } from '@/shared/database/drizzle/drizzle-client'
import { ConflictError } from '@hms/core/shared/domain/errors'

type CaseManagementDatabaseExecutor = Parameters<
  Parameters<Database['transaction']>[0]
>[0]

@Injectable()
export class DrizzleLegalCasesRepository
  extends DrizzleRepository
  implements LegalCasesRepository
{
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleLegalCaseMapper)
    private readonly legalCaseMapper: DrizzleLegalCaseMapper,
    @Optional() private readonly executor?: CaseManagementDatabaseExecutor,
  ) {
    super(drizzle)
  }

  protected get database() {
    return this.executor ?? this.drizzleClient.requireDatabase()
  }

  async createCaseWithTeam({
    legalCase,
    team,
  }: Parameters<LegalCasesRepository['createCaseWithTeam']>[0]): ReturnType<
    LegalCasesRepository['createCaseWithTeam']
  > {
    const create = async (tx: CaseManagementDatabaseExecutor) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1001)`)

      const startOfDay = new Date(legalCase.openedAt)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(legalCase.openedAt)
      endOfDay.setHours(23, 59, 59, 999)

      const [result] = await tx
        .select({ count: sql<number>`cast(count(${legalCaseModel.id}) as integer)` })
        .from(legalCaseModel)
        .where(
          and(
            gte(legalCaseModel.openedAt, startOfDay),
            lt(legalCaseModel.openedAt, endOfDay),
          ),
        )

      const casesToday = result.count
      const publicCode = this.createPublicCaseCode(legalCase.openedAt, casesToday)

      const [createdLegalCase] = await tx
        .insert(legalCaseModel)
        .values({ ...legalCase, publicCode })
        .returning()

      if (team.length > 0) {
        const caseMembers = team.map((member) => ({
          ...member,
          caseId: createdLegalCase.id,
        }))
        await tx.insert(caseMemberModel).values(caseMembers)
      }

      return this.legalCaseMapper.toDomain(createdLegalCase)
    }
    return this.executor
      ? create(this.executor)
      : this.drizzleClient.requireDatabase().transaction(create)
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

  async completeChecklist(
    caseId: string,
    completedBy: string,
  ): ReturnType<LegalCasesRepository['completeChecklist']> {
    const [updatedCase] = await this.database
      .update(legalCaseModel)
      .set({
        checklistCompletedAt: new Date(),
        checklistCompletedBy: completedBy,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(legalCaseModel.id, caseId),
          eq(legalCaseModel.status, LegalCaseStatus.Documentation),
          isNull(legalCaseModel.checklistGateDecision),
        ),
      )
      .returning()

    return updatedCase ? this.legalCaseMapper.toDomain(updatedCase) : undefined
  }

  async findById(caseId: string): ReturnType<LegalCasesRepository['findById']> {
    const [legalCase] = await this.database
      .select()
      .from(legalCaseModel)
      .where(eq(legalCaseModel.id, caseId))
      .limit(1)

    return legalCase ? this.legalCaseMapper.toDomain(legalCase) : undefined
  }

  async replaceTeamVersion(caseId: string, expectedTeamVersion: number): Promise<number> {
    const [updated] = await this.database
      .update(legalCaseModel)
      .set({ teamVersion: sql`${legalCaseModel.teamVersion} + 1` })
      .where(
        and(
          eq(legalCaseModel.id, caseId),
          eq(legalCaseModel.teamVersion, expectedTeamVersion),
        ),
      )
      .returning({ teamVersion: legalCaseModel.teamVersion })
    if (!updated)
      throw new ConflictError('A equipe mudou. Atualize e confirme novamente.')
    return updated.teamVersion
  }

  async listByTeamMember(
    collaboratorId: string,
    clientId?: string,
  ): ReturnType<LegalCasesRepository['listByTeamMember']> {
    const assignedCases = await this.database
      .select({ legalCase: legalCaseModel })
      .from(legalCaseModel)
      .innerJoin(
        caseMemberModel,
        and(
          eq(caseMemberModel.caseId, legalCaseModel.id),
          eq(caseMemberModel.collaboratorId, collaboratorId),
          isNull(caseMemberModel.removedAt),
          eq(caseMemberModel.archivedLegacy, false),
        ),
      )
      .where(clientId ? eq(legalCaseModel.clientId, clientId) : undefined)
      .orderBy(desc(legalCaseModel.openedAt))

    return assignedCases.map(({ legalCase }) => this.legalCaseMapper.toDomain(legalCase))
  }

  async reviewChecklistGate({
    caseId,
    checklistGate,
    expectedStatus,
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
        checklistGateRemarks: checklistGate.remarks ?? null,
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(legalCaseModel.id, caseId),
          eq(legalCaseModel.status, expectedStatus),
          isNull(legalCaseModel.checklistGateDecision),
        ),
      )
      .returning()

    return updatedCase ? this.legalCaseMapper.toDomain(updatedCase) : undefined
  }

  async homologateDossier({
    caseId,
    homologatedBy,
    expectedStatus,
    status,
  }: Parameters<LegalCasesRepository['homologateDossier']>[0]): ReturnType<
    LegalCasesRepository['homologateDossier']
  > {
    const now = new Date()
    const [updatedCase] = await this.database
      .update(legalCaseModel)
      .set({
        dossierGateHomologatedAt: now,
        dossierGateHomologatedBy: homologatedBy,
        status,
        updatedAt: now,
      })
      .where(
        and(
          eq(legalCaseModel.id, caseId),
          eq(legalCaseModel.status, expectedStatus),
          inArray(legalCaseModel.checklistGateDecision, [
            'approved',
            'approved_with_exception',
          ]),
          isNull(legalCaseModel.dossierGateHomologatedAt),
        ),
      )
      .returning()

    return updatedCase ? this.legalCaseMapper.toDomain(updatedCase) : undefined
  }

  private createPublicCaseCode(openedAt: Date, dailyCaseCount: number) {
    const date = openedAt.toISOString().slice(0, 10).replaceAll('-', '')
    const sequence = (dailyCaseCount + 1).toString().padStart(4, '0')
    return `CASO-${date}-${sequence}`
  }
}
