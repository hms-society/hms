import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureOtpChallengeModel } from '@/formalization/database/drizzle/models/formalization-signature-otp-challenge-model'

export type DrizzleFormalizationSignatureOtpChallenge = InferSelectModel<
  typeof formalizationSignatureOtpChallengeModel
>
