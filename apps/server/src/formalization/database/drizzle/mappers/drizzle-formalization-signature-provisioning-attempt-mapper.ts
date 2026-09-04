import type { FormalizationSignatureProvisioningAttempt } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureProvisioningAttempt } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-provisioning-attempt'

export class DrizzleFormalizationSignatureProvisioningAttemptMapper {
  toDomain(
    record: DrizzleFormalizationSignatureProvisioningAttempt,
  ): FormalizationSignatureProvisioningAttempt {
    return {
      ...record,
      status: record.status as FormalizationSignatureProvisioningAttempt['status'],
      leaseExpiresAt: record.leaseExpiresAt ?? undefined,
      nextAttemptAt: record.nextAttemptAt ?? undefined,
      lastFailureCode: record.lastFailureCode ?? undefined,
    }
  }
}
