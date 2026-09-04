import type { FormalizationSignatureProviderRecipientResource } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureProviderRecipientResource } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-provider-recipient-resource'
import { decodeSignaturePayload } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureProviderRecipientResourceMapper {
  toDomain(
    record: DrizzleFormalizationSignatureProviderRecipientResource,
  ): FormalizationSignatureProviderRecipientResource {
    return {
      ...record,
      encryptedSigningCredential: decodeSignaturePayload(
        record.encryptedSigningCredential,
      ),
      lastReconciledAt: record.lastReconciledAt ?? undefined,
    }
  }
}
