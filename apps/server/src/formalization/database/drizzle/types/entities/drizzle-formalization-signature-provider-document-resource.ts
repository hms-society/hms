import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureProviderDocumentResourceModel } from '@/formalization/database/drizzle/models/formalization-signature-provider-document-resource-model'

export type DrizzleFormalizationSignatureProviderDocumentResource = InferSelectModel<
  typeof formalizationSignatureProviderDocumentResourceModel
>
