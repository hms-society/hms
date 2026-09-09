import type { FormalizationSignatureProviderDocumentResource } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureProviderDocumentResource } from '@/formalization/database/drizzle/types/entities'

export class DrizzleFormalizationSignatureProviderDocumentResourceMapper {
  toDomain(
    record: DrizzleFormalizationSignatureProviderDocumentResource,
  ): FormalizationSignatureProviderDocumentResource {
    return record
  }
}
