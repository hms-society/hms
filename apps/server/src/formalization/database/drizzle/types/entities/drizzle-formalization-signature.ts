import type { InferSelectModel } from 'drizzle-orm'

import {
  formalizationSignatoryDocumentModel,
  formalizationSignatoryModel,
  formalizationSignatureFieldModel,
  formalizationSignaturePreviewModel,
} from '@/formalization/database/drizzle/models'

export type DrizzleFormalizationSignatory = InferSelectModel<
  typeof formalizationSignatoryModel
>
export type DrizzleFormalizationSignatoryDocument = InferSelectModel<
  typeof formalizationSignatoryDocumentModel
>
export type DrizzleFormalizationSignaturePreview = InferSelectModel<
  typeof formalizationSignaturePreviewModel
>
export type DrizzleFormalizationSignatureField = InferSelectModel<
  typeof formalizationSignatureFieldModel
>
