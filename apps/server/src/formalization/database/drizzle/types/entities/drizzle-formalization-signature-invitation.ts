import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureInvitationModel } from '@/formalization/database/drizzle/models/formalization-signature-invitation-model'

export type DrizzleFormalizationSignatureInvitation = InferSelectModel<
  typeof formalizationSignatureInvitationModel
>
