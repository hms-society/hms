import type { FormalizationSignatureWebhookReceipt } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureWebhookReceipt } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-webhook-receipt'
import {
  decodeSignatureHash,
  decodeSignaturePayload,
} from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureWebhookReceiptMapper {
  toDomain(
    record: DrizzleFormalizationSignatureWebhookReceipt,
  ): FormalizationSignatureWebhookReceipt {
    return {
      ...record,
      dedupeKey: decodeSignatureHash(record.dedupeKey),
      hintKind: record.hintKind as FormalizationSignatureWebhookReceipt['hintKind'],
      encryptedHint: decodeSignaturePayload(record.encryptedHint),
      status: record.status as FormalizationSignatureWebhookReceipt['status'],
      claimToken: record.claimToken ?? undefined,
      leaseUntil: record.leaseUntil ?? undefined,
      nextAttemptAt: record.nextAttemptAt ?? undefined,
      processedAt: record.processedAt ?? undefined,
    }
  }
}
