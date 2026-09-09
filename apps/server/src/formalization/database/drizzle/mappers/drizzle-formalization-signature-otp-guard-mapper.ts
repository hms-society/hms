import type { FormalizationSignatureOtpGuard } from '@hms/core/formalization/domain/structures'
import type { DrizzleFormalizationSignatureOtpGuard } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-otp-guard'

export class DrizzleFormalizationSignatureOtpGuardMapper {
  toDomain(
    record: DrizzleFormalizationSignatureOtpGuard,
  ): FormalizationSignatureOtpGuard {
    return {
      ...record,
      failedAttempts: record.failedAttempts,
      sendsInWindow: record.sendsInWindow,
      lastSentAt: record.lastSentAt ?? undefined,
      lockedUntil: record.lockedUntil ?? undefined,
    }
  }
}
