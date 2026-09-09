import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureCancellationAttemptModel } from '@/formalization/database/drizzle/models/formalization-signature-cancellation-attempt-model'

export type DrizzleFormalizationSignatureCancellationAttempt = InferSelectModel<
  typeof formalizationSignatureCancellationAttemptModel
>
