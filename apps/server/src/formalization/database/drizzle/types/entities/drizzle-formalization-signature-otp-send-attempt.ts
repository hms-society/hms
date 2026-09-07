import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureOtpSendAttemptModel } from '@/formalization/database/drizzle/models/formalization-signature-otp-send-attempt-model'

export type DrizzleFormalizationSignatureOtpSendAttempt = InferSelectModel<
  typeof formalizationSignatureOtpSendAttemptModel
>
