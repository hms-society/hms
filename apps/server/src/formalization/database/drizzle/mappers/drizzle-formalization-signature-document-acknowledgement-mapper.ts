import type { FormalizationSignatureDocumentAcknowledgement } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureDocumentAcknowledgement } from '@/formalization/database/drizzle/types/entities'
import {
  decodeSignatureHash,
  encodeSignatureHash,
} from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureDocumentAcknowledgementMapper {
  toPersistence(acknowledgement: FormalizationSignatureDocumentAcknowledgement) {
    return {
      ...acknowledgement,
      sourceIpHash: acknowledgement.sourceIpHash
        ? encodeSignatureHash(acknowledgement.sourceIpHash)
        : null,
      userAgentHash: acknowledgement.userAgentHash
        ? encodeSignatureHash(acknowledgement.userAgentHash)
        : null,
    }
  }

  toDomain(
    record: DrizzleFormalizationSignatureDocumentAcknowledgement,
  ): FormalizationSignatureDocumentAcknowledgement {
    return {
      ...record,
      sourceIpHash: record.sourceIpHash
        ? decodeSignatureHash(record.sourceIpHash)
        : undefined,
      userAgentHash: record.userAgentHash
        ? decodeSignatureHash(record.userAgentHash)
        : undefined,
    }
  }
}
