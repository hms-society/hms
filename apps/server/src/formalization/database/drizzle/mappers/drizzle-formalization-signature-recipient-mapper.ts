import type { FormalizationSignatureRecipient } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureRecipient } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-recipient'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureRecipientMapper {
  toDomain(
    record: DrizzleFormalizationSignatureRecipient,
  ): FormalizationSignatureRecipient {
    return {
      ...record,
      actorKind: record.actorKind as FormalizationSignatureRecipient['actorKind'],
      deliveryChannel:
        record.deliveryChannel as FormalizationSignatureRecipient['deliveryChannel'],
      status: record.status as FormalizationSignatureRecipient['status'],
      submissionObservationId: record.submissionObservationId
        ? decodeSignatureHash(record.submissionObservationId)
        : undefined,
      invitedAt: record.invitedAt ?? undefined,
      submittedAt: record.submittedAt ?? undefined,
      confirmedAt: record.confirmedAt ?? undefined,
      terminalAt: record.terminalAt ?? undefined,
    }
  }
}
