import type { InferSelectModel } from 'drizzle-orm'

import { formalizationSignatureOtpRateReservationModel } from '@/formalization/database/drizzle/models/formalization-signature-otp-rate-reservation-model'

export type DrizzleFormalizationSignatureOtpRateReservation = InferSelectModel<
  typeof formalizationSignatureOtpRateReservationModel
>
