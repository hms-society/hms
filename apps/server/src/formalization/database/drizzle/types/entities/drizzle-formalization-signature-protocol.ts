import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureProtocolModel } from '@/formalization/database/drizzle/models/formalization-signature-protocol-model'

export type DrizzleFormalizationSignatureProtocol = InferSelectModel<
  typeof formalizationSignatureProtocolModel
>
