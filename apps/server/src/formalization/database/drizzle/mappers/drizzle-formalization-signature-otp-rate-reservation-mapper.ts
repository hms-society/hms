import type { FormalizationSignatureOtpRateReservation } from '@hms/core/formalization/domain/entities'
import type { DrizzleFormalizationSignatureOtpRateReservation } from '@/formalization/database/drizzle/types/entities/drizzle-formalization-signature-otp-rate-reservation'
import { decodeSignatureHash } from '@/formalization/database/drizzle/signature-binary'

export class DrizzleFormalizationSignatureOtpRateReservationMapper {
  toDomain(
    record: DrizzleFormalizationSignatureOtpRateReservation,
  ): FormalizationSignatureOtpRateReservation {
    return {
      ...record,
      sourceIpHash: decodeSignatureHash(record.sourceIpHash),
    }
  }
}
