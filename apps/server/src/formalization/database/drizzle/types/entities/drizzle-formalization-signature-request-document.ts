import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureRequestDocumentModel } from '@/formalization/database/drizzle/models/formalization-signature-request-document-model'

export type DrizzleFormalizationSignatureRequestDocument = InferSelectModel<
  typeof formalizationSignatureRequestDocumentModel
>
