import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureOtpGuardModel } from '@/formalization/database/drizzle/models/formalization-signature-otp-guard-model'

export type DrizzleFormalizationSignatureOtpGuard = InferSelectModel<
  typeof formalizationSignatureOtpGuardModel
>
