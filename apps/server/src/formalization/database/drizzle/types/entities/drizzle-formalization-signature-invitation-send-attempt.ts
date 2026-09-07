import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureInvitationSendAttemptModel } from '@/formalization/database/drizzle/models/formalization-signature-invitation-send-attempt-model'

export type DrizzleFormalizationSignatureInvitationSendAttempt = InferSelectModel<
  typeof formalizationSignatureInvitationSendAttemptModel
>
