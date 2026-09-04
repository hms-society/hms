import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureProxyBindingModel } from '@/formalization/database/drizzle/models/formalization-signature-proxy-binding-model'

export type DrizzleFormalizationSignatureProxyBinding = InferSelectModel<
  typeof formalizationSignatureProxyBindingModel
>
