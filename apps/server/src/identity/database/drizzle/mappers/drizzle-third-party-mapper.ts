import type { ThirdParty } from '@hms/core/identity/domain/entities'

import type { DrizzleThirdParty } from '@/identity/database/drizzle/types'

export class DrizzleThirdPartyMapper {
  toDomain(record: DrizzleThirdParty): ThirdParty {
    return {
      id: record.id,
      type: record.type,
      legalName: record.legalName,
      tradeName: record.tradeName ?? undefined,
      taxId: {
        type: record.taxIdType,
        value: record.taxIdValue,
        description: record.taxIdDescription ?? undefined,
      },
      internalResponsibleId: record.internalResponsibleId,
      relationshipTypes: record.relationshipTypes as ThirdParty['relationshipTypes'],
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
