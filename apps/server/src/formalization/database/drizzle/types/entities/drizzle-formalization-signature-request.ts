import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureRequestModel } from '@/formalization/database/drizzle/models/formalization-signature-request-model'

export type DrizzleFormalizationSignatureRequest = InferSelectModel<
  typeof formalizationSignatureRequestModel
>
