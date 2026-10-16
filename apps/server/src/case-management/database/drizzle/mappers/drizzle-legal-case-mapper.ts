import type { LegalCaseOperationalRecord } from '@hms/core/case-management/domain/entities'
import type { DrizzleLegalCaseOperationalRecord } from '@/case-management/database/drizzle/types'
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
      description: record.description ?? undefined,
      status: record.status,
      lifecycleStatus: record.lifecycleStatus ?? 'active',
      workflowStage:
        record.workflowStage && record.workflowStage !== 'closed'
          ? record.workflowStage
          : record.status !== 'closed'
            ? record.status
            : undefined,
      teamVersion: record.teamVersion,
      checklistCompletedAt: record.checklistCompletedAt ?? undefined,
      checklistCompletedBy: record.checklistCompletedBy ?? undefined,
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
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
  toOperationalRecord(
    record: DrizzleLegalCaseOperationalRecord,
  ): LegalCaseOperationalRecord {
    return {
      id: record.id,
      publicCode: record.publicCode,
      title: record.title,
      status: record.status,
      clientId: record.clientId,
      legalAreaId: record.legalAreaId,
      legalTopicId: record.legalTopicId,
      updatedAt: record.updatedAt,
      managerCollaboratorIds: record.managerCollaboratorIds,
    }
  }
}
