import type { FormalizationSignatureProtocol } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureProtocol } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-protocol'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureProtocolMapper {
  toDomain(
    record: DrizzleFormalizationSignatureProtocol,
  ): FormalizationSignatureProtocol {
    return {
      ...record,
      artifactSetHash: decodeSignatureHash(record.artifactSetHash),
    }
  }
}
