import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureDocumentAcknowledgementModel } from '@/formalization/database/drizzle/models/formalization-signature-document-acknowledgement-model'

export type DrizzleFormalizationSignatureDocumentAcknowledgement = InferSelectModel<
  typeof formalizationSignatureDocumentAcknowledgementModel
>
