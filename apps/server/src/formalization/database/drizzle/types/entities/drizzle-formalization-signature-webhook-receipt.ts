import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureWebhookReceiptModel } from '@/formalization/database/drizzle/models/formalization-signature-webhook-receipt-model'

export type DrizzleFormalizationSignatureWebhookReceipt = InferSelectModel<
  typeof formalizationSignatureWebhookReceiptModel
>
