import type { FormalizationSignatureOtpSendAttempt } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureOtpSendAttempt } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-otp-send-attempt'
import { decodeSignaturePayload } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureOtpSendAttemptMapper {
  toDomain(
    record: DrizzleFormalizationSignatureOtpSendAttempt,
  ): FormalizationSignatureOtpSendAttempt {
    return {
      ...record,
      encryptedPayload: decodeSignaturePayload(record.encryptedPayload),
      status: record.status as FormalizationSignatureOtpSendAttempt['status'],
      providerMessageId: record.providerMessageId ?? undefined,
      nextAttemptAt: record.nextAttemptAt ?? undefined,
      deliveredAt: record.deliveredAt ?? undefined,
    }
  }
}
