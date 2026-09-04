import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureRecipientDocumentModel } from '@/formalization/database/drizzle/models/formalization-signature-recipient-document-model'

export type DrizzleFormalizationSignatureRecipientDocument = InferSelectModel<
  typeof formalizationSignatureRecipientDocumentModel
>
