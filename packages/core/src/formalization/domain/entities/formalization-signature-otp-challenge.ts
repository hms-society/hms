import type { Entity } from '#shared/domain/entities/entity'
import type { FormalizationSignatureOtpChallengeStatus } from '../structures/formalization-signature-otp-challenge-status'

export type FormalizationSignatureOtpChallenge = Entity & {
  invitationId: string
  generation: number
  codeMac: string
  channelChoiceId: string
  destinationFingerprint: string
  status: FormalizationSignatureOtpChallengeStatus
  failedAttempts: number
  issuedAt: Date
  sentAt?: Date
  expiresAt?: Date
  consumedAt?: Date
}
