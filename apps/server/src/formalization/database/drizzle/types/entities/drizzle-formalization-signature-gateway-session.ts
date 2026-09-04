import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureGatewaySessionModel } from '@/formalization/database/drizzle/models/formalization-signature-gateway-session-model'

export type DrizzleFormalizationSignatureGatewaySession = InferSelectModel<
  typeof formalizationSignatureGatewaySessionModel
>
