import type { FormalizationSignatureOtpRateReservation } from '../domain/entities'
export interface FormalizationSignatureOtpRateReservationsRepository {
  add(reservation: FormalizationSignatureOtpRateReservation): Promise<void>
  countByInvitationIdSince(invitationId: string, since: Date): Promise<number>
  countBySourceIpHashSince(sourceIpHash: string, since: Date): Promise<number>
  removeAllExpired(before: Date): Promise<number>
}
