import type { FormalizationSignatureRequest } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureRequest } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-request'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureRequestMapper {
  toDomain(record: DrizzleFormalizationSignatureRequest): FormalizationSignatureRequest {
    return {
      ...(record as unknown as FormalizationSignatureRequest),
      confirmationKeyHash: decodeSignatureHash(record.confirmationKeyHash),
      status: record.status as FormalizationSignatureRequest['status'],
      sentAt: record.sentAt ?? undefined,
      submittedAt: record.submittedAt ?? undefined,
      confirmedAt: record.confirmedAt ?? undefined,
      terminalAt: record.terminalAt ?? undefined,
      cancellationRequestedAt: record.cancellationRequestedAt ?? undefined,
    }
  }
}
