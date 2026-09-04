import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureRecipientModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-model'

export type DrizzleFormalizationSignatureRecipient = InferSelectModel<
  typeof formalizationSignatureRecipientModel
>
