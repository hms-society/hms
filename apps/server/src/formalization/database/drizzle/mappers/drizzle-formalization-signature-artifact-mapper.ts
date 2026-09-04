import type { FormalizationSignatureArtifact } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureArtifact } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-artifact'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureArtifactMapper {
  toDomain(
    record: DrizzleFormalizationSignatureArtifact,
  ): FormalizationSignatureArtifact {
    return {
      ...record,
      requestDocumentId: record.requestDocumentId ?? undefined,
      sha256: decodeSignatureHash(record.sha256),
      kind: record.kind as FormalizationSignatureArtifact['kind'],
      providerReference: record.providerReference ?? undefined,
    }
  }
}
