import type { FormalizationSignatureRecipientDocument } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureRecipientDocument } from '@/formalization/database/drizzle/types/entities'

export class DrizzleFormalizationSignatureRecipientDocumentMapper {
  toDomain(
    record: DrizzleFormalizationSignatureRecipientDocument,
  ): FormalizationSignatureRecipientDocument {
    return record
  }
}
