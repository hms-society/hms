import type { FormalizationSignatureProviderResource } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureProviderResource } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-provider-resource'

export class DrizzleFormalizationSignatureProviderResourceMapper {
  toDomain(
    record: DrizzleFormalizationSignatureProviderResource,
  ): FormalizationSignatureProviderResource {
    return {
      ...record,
      provider: record.provider as FormalizationSignatureProviderResource['provider'],
      lastReconciledAt: record.lastReconciledAt ?? undefined,
    }
  }
}
