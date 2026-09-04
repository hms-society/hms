import type { FormalizationSignatureGatewaySession } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureGatewaySession } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-gateway-session'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureGatewaySessionMapper {
  toDomain(
    record: DrizzleFormalizationSignatureGatewaySession,
  ): FormalizationSignatureGatewaySession {
    return {
      ...record,
      kind: record.kind as FormalizationSignatureGatewaySession['kind'],
      tokenHash: decodeSignatureHash(record.tokenHash),
      deviceSecretHash: decodeSignatureHash(record.deviceSecretHash),
      csrfHash: decodeSignatureHash(record.csrfHash),
      status: record.status as FormalizationSignatureGatewaySession['status'],
      revokedAt: record.revokedAt ?? undefined,
      revocationReason: record.revocationReason ?? undefined,
    }
  }
}
