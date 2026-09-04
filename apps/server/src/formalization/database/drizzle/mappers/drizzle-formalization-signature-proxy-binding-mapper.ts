import type { FormalizationSignatureProxyBinding } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureProxyBinding } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-proxy-binding'
import {
  decodeSignatureHash,
  decodeSignaturePayload,
} from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureProxyBindingMapper {
  toDomain(
    record: DrizzleFormalizationSignatureProxyBinding,
  ): FormalizationSignatureProxyBinding {
    return {
      ...record,
      aliasHash: decodeSignatureHash(record.aliasHash),
      encryptedProviderCredential: decodeSignaturePayload(
        record.encryptedProviderCredential,
      ),
      status: record.status as FormalizationSignatureProxyBinding['status'],
      revokedAt: record.revokedAt ?? undefined,
      revocationReason: record.revocationReason ?? undefined,
    }
  }
}
