import type { Entity } from '#shared/domain/entities/entity'

export type FormalizationSignatureOtpRateReservation = Entity & {
  invitationId: string
  sourceIpHash: string
  reservedAt: Date
}
