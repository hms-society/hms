import type { FormalizationSignatureOtpChallenge } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureOtpChallenge } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-otp-challenge'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureOtpChallengeMapper {
  toDomain(
    record: DrizzleFormalizationSignatureOtpChallenge,
  ): FormalizationSignatureOtpChallenge {
    return {
      ...record,
      codeMac: decodeSignatureHash(record.codeMac),
      destinationFingerprint: decodeSignatureHash(record.destinationFingerprint),
      status: record.status as FormalizationSignatureOtpChallenge['status'],
      sentAt: record.sentAt ?? undefined,
      expiresAt: record.expiresAt ?? undefined,
      consumedAt: record.consumedAt ?? undefined,
    }
  }
}
