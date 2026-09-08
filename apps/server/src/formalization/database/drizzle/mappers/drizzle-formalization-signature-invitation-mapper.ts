import type { FormalizationSignatureInvitation } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureInvitation } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-invitation'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureInvitationMapper {
  toDomain(
    record: DrizzleFormalizationSignatureInvitation,
  ): FormalizationSignatureInvitation {
    return {
      ...record,
      tokenHash: decodeSignatureHash(record.tokenHash),
      status: record.status as FormalizationSignatureInvitation['status'],
      deliveryStatus:
        record.deliveryStatus as FormalizationSignatureInvitation['deliveryStatus'],
      communicationMessageId: record.communicationMessageId ?? undefined,
      deliveredAt: record.deliveredAt ?? undefined,
      consumedAt: record.consumedAt ?? undefined,
      revokedAt: record.revokedAt ?? undefined,
      revocationReason: record.revocationReason ?? undefined,
    }
  }
}
