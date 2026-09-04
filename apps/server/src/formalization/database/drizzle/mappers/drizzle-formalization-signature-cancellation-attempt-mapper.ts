import type { FormalizationSignatureCancellationAttempt } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureCancellationAttempt } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-cancellation-attempt'

export class DrizzleFormalizationSignatureCancellationAttemptMapper {
  toDomain(
    record: DrizzleFormalizationSignatureCancellationAttempt,
  ): FormalizationSignatureCancellationAttempt {
    return {
      ...record,
      status: record.status as FormalizationSignatureCancellationAttempt['status'],
      leaseExpiresAt: record.leaseExpiresAt ?? undefined,
      nextAttemptAt: record.nextAttemptAt ?? undefined,
      lastFailureCode: record.lastFailureCode ?? undefined,
    }
  }
}
