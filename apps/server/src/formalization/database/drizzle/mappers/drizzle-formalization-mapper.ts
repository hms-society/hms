import type { Formalization } from '@hms/core/formalization/domain/entities'

import type { DrizzleFormalization } from '@/formalization/database/drizzle/types/entities'

export class DrizzleFormalizationMapper {
  toDomain(record: DrizzleFormalization): Formalization {
    return {
      ...record,
      legalAreaId: record.legalAreaId ?? undefined,
      legalTopicId: record.legalTopicId ?? undefined,
      status: record.status as Formalization['status'],
      contractFormState: record.contractFormState as Formalization['contractFormState'],
      contractFormClosedAt: record.contractFormClosedAt ?? undefined,
      contractFormClosedByCollaboratorId:
        record.contractFormClosedByCollaboratorId ?? undefined,
      documentsConfirmedAt: record.documentsConfirmedAt ?? undefined,
      documentsConfirmedByCollaboratorId:
        record.documentsConfirmedByCollaboratorId ?? undefined,
      documentsConfirmedRevision: record.documentsConfirmedRevision ?? undefined,
      cancelledAt: record.cancelledAt ?? undefined,
      cancelledByCollaboratorId: record.cancelledByCollaboratorId ?? undefined,
    }
  }
}
