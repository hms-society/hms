import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureProviderRecipientResourceModel } from '@/formalization/database/drizzle/models/formalization-signature-provider-recipient-resource-model'

export type DrizzleFormalizationSignatureProviderRecipientResource = InferSelectModel<
  typeof formalizationSignatureProviderRecipientResourceModel
>
