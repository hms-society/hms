import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureProviderResourceModel } from '@/formalization/database/drizzle/models/formalization-signature-provider-resource-model'

export type DrizzleFormalizationSignatureProviderResource = InferSelectModel<
  typeof formalizationSignatureProviderResourceModel
>
