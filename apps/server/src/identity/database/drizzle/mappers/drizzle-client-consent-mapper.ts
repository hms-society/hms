import type { ClientConsent } from '@hms/core/identity/domain/entities'

import type { DrizzleClientConsent } from '@/identity/database/drizzle/types/entities'

export class DrizzleClientConsentMapper {
  toDomain(drizzleConsent: DrizzleClientConsent): ClientConsent {
    return {
      id: drizzleConsent.id,
      clientId: drizzleConsent.clientId,
      type: drizzleConsent.type,
      grantedAt: drizzleConsent.grantedAt,
      revokedAt: drizzleConsent.revokedAt ?? undefined,
    }
  }
}
