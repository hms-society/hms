import type { FormalizationSignatureWebhookReceipt } from '../domain/entities'
import type { FormalizationSignatureWebhookReceiptChanges } from '../domain/structures'
export interface FormalizationSignatureWebhookReceiptsRepository {
  add(receipt: FormalizationSignatureWebhookReceipt): Promise<void>
  findById(receiptId: string): Promise<FormalizationSignatureWebhookReceipt | null>
  findByDedupeKey(dedupeKey: string): Promise<FormalizationSignatureWebhookReceipt | null>
  findPending(now: Date, limit: number): Promise<FormalizationSignatureWebhookReceipt[]>
  replace(input: {
    receiptId: string
    changes: FormalizationSignatureWebhookReceiptChanges
  }): Promise<void>
}
