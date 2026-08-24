import { Injectable } from '@nestjs/common'
import type { LegalCase } from '@hms/core/case-management/domain/entities'

import type { DrizzleLegalCase } from '@/case-management/database/drizzle/types'

@Injectable()
export class DrizzleLegalCaseMapper {
  toDomain(record: DrizzleLegalCase): LegalCase {
    return {
      id: record.id,
      publicCode: record.publicCode,
      clientId: record.clientId,
      intakeId: record.intakeId,
      legalAreaId: record.legalAreaId,
      legalTopicId: record.legalTopicId,
      title: record.title,
      status: record.status,
      checklistGate: {
        decision: record.checklistGateDecision ?? undefined,
        decidedAt: record.checklistGateDecidedAt ?? undefined,
        decidedBy: record.checklistGateDecidedBy ?? undefined,
        remarks: record.checklistGateRemarks ?? undefined,
      },
      dossierGate: {
        homologatedAt: record.dossierGateHomologatedAt ?? undefined,
        homologatedBy: record.dossierGateHomologatedBy ?? undefined,
      },
      openedAt: record.openedAt,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
