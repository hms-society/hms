import type { FormalizationSignatureOtpChallenge } from '../domain/entities'
import type { FormalizationSignatureOtpChallengeChanges } from '../domain/structures'
export interface FormalizationSignatureOtpChallengesRepository {
  add(challenge: FormalizationSignatureOtpChallenge): Promise<void>
  findById(challengeId: string): Promise<FormalizationSignatureOtpChallenge | null>
  findCurrentByInvitationId(
    invitationId: string,
  ): Promise<FormalizationSignatureOtpChallenge | null>
  findLatestByInvitationId(
    invitationId: string,
  ): Promise<FormalizationSignatureOtpChallenge | null>
  replace(input: {
    challengeId: string
    changes: FormalizationSignatureOtpChallengeChanges
  }): Promise<void>
}
