import type { FormalizationSignatureRequestDocument } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureRequestDocument } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-request-document'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureRequestDocumentMapper {
  toDomain(
    record: DrizzleFormalizationSignatureRequestDocument,
  ): FormalizationSignatureRequestDocument {
    return {
      ...record,
      unsignedSha256: decodeSignatureHash(record.unsignedSha256),
      status: record.status as FormalizationSignatureRequestDocument['status'],
      provisionedAt: record.provisionedAt ?? undefined,
      submittedAt: record.submittedAt ?? undefined,
      confirmedAt: record.confirmedAt ?? undefined,
      terminalAt: record.terminalAt ?? undefined,
    }
  }
}
