import type { FormalizationSignatureInvitationSendAttempt } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureInvitationSendAttempt } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-invitation-send-attempt'
import { decodeSignaturePayload } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureInvitationSendAttemptMapper {
  toDomain(
    record: DrizzleFormalizationSignatureInvitationSendAttempt,
  ): FormalizationSignatureInvitationSendAttempt {
    return {
      ...record,
      encryptedPayload: decodeSignaturePayload(record.encryptedPayload),
      status: record.status as FormalizationSignatureInvitationSendAttempt['status'],
      communicationMessageId: record.communicationMessageId ?? undefined,
      nextAttemptAt: record.nextAttemptAt ?? undefined,
      deliveredAt: record.deliveredAt ?? undefined,
    }
  }
}
