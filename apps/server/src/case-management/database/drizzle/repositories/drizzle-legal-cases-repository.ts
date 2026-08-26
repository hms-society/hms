import { Inject, Injectable } from '@nestjs/common'
import type {
  LegalCaseSummary,
  LegalCaseTeamMemberSummary,
} from '@hms/core/case-management/domain/entities'
import type { LegalCasesRepository } from '@hms/core/case-management/interfaces'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'

import { DrizzleLegalCaseMapper } from '@/case-management/database/drizzle/mappers'
import {
  caseMemberModel,
  legalCaseModel,
} from '@/case-management/database/drizzle/models'
import { clientModel, collaboratorModel } from '@/identity/database/drizzle/models'
import { legalAreaModel, legalTopicModel } from '@/legal-catalog/database/drizzle/models'
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

  async listByTeamMember(
    collaboratorId: string,
  ): ReturnType<LegalCasesRepository['listByTeamMember']> {
    const assignedCases = await this.database
      .select({
        id: legalCaseModel.id,
        publicCode: legalCaseModel.publicCode,
        title: legalCaseModel.title,
        status: legalCaseModel.status,
        clientName: sql<string>`coalesce(${clientModel.name}, ${clientModel.legalName}, ${clientModel.tradeName})`,
        legalArea: legalAreaModel.name,
        legalTopic: legalTopicModel.name,
        openedAt: legalCaseModel.openedAt,
        updatedAt: legalCaseModel.updatedAt,
        version: legalCaseModel.version,
        checklistGateDecision: legalCaseModel.checklistGateDecision,
        checklistGateDecidedAt: legalCaseModel.checklistGateDecidedAt,
        checklistGateDecidedBy: legalCaseModel.checklistGateDecidedBy,
        checklistGateRemarks: legalCaseModel.checklistGateRemarks,
        dossierGateHomologatedAt: legalCaseModel.dossierGateHomologatedAt,
        dossierGateHomologatedBy: legalCaseModel.dossierGateHomologatedBy,
      })
      .from(legalCaseModel)
      .innerJoin(clientModel, eq(clientModel.id, legalCaseModel.clientId))
      .innerJoin(legalAreaModel, eq(legalAreaModel.id, legalCaseModel.legalAreaId))
      .innerJoin(legalTopicModel, eq(legalTopicModel.id, legalCaseModel.legalTopicId))
      .innerJoin(caseMemberModel, eq(caseMemberModel.caseId, legalCaseModel.id))
      .where(eq(caseMemberModel.collaboratorId, collaboratorId))
      .orderBy(desc(legalCaseModel.openedAt))

    if (assignedCases.length === 0) return []

    const caseIds = assignedCases.map(({ id }) => id)
    const teamMembers = await this.database
      .select({
        caseId: caseMemberModel.caseId,
        collaboratorId: caseMemberModel.collaboratorId,
        name: collaboratorModel.professionalName,
        role: caseMemberModel.role,
        isPrimary: caseMemberModel.isPrimary,
      })
      .from(caseMemberModel)
      .innerJoin(
        collaboratorModel,
        eq(collaboratorModel.id, caseMemberModel.collaboratorId),
      )
      .where(inArray(caseMemberModel.caseId, caseIds))

    const teamMembersByCaseId = new Map<string, LegalCaseTeamMemberSummary[]>()
    for (const teamMember of teamMembers) {
      const caseTeam = teamMembersByCaseId.get(teamMember.caseId) ?? []
      caseTeam.push({
        collaboratorId: teamMember.collaboratorId,
        name: teamMember.name,
        role: teamMember.role,
        isPrimary: teamMember.isPrimary,
      })
      teamMembersByCaseId.set(teamMember.caseId, caseTeam)
    }

    return assignedCases.map(
      (legalCase): LegalCaseSummary => ({
        id: legalCase.id,
        publicCode: legalCase.publicCode,
        title: legalCase.title,
        status: legalCase.status,
        clientName: legalCase.clientName,
        legalArea: legalCase.legalArea,
        legalTopic: legalCase.legalTopic,
        openedAt: legalCase.openedAt,
        updatedAt: legalCase.updatedAt,
        version: legalCase.version,
        checklistGate: {
          decision: legalCase.checklistGateDecision ?? undefined,
          decidedAt: legalCase.checklistGateDecidedAt ?? undefined,
          decidedBy: legalCase.checklistGateDecidedBy ?? undefined,
          remarks: legalCase.checklistGateRemarks ?? undefined,
        },
        dossierGate: {
          homologatedAt: legalCase.dossierGateHomologatedAt ?? undefined,
          homologatedBy: legalCase.dossierGateHomologatedBy ?? undefined,
        },
        team: teamMembersByCaseId.get(legalCase.id) ?? [],
      }),
    )
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
