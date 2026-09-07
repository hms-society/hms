import type { Broker, UseCase } from '../../shared/interfaces'
import { FormalizationSignatureOtpDeliveryRequestedEvent } from '../domain/events'
import type {
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureOtpChallengesRepository,
  FormalizationSignatureOtpSendAttemptsRepository,
} from '../interfaces'

type Request = { readonly occurredAt: Date; readonly limit: number }
type Response = { readonly published: number }
type Dependencies = {
  readonly attemptsRepository: FormalizationSignatureOtpSendAttemptsRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly challengesRepository: FormalizationSignatureOtpChallengesRepository
  readonly broker: Broker
}

export class ReconcileFormalizationSignatureOtpDeliveriesUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const attempts = await this.dependencies.attemptsRepository.findPending(
      request.occurredAt,
      request.limit,
    )
    let published = 0

    for (const attempt of attempts) {
      const challenge =
        await this.dependencies.challengesRepository.findCurrentByInvitationId(
          attempt.challengeId,
        )
      if (!challenge || challenge.id !== attempt.challengeId || !challenge.expiresAt)
        continue
      const invitation = await this.dependencies.invitationsRepository.findById(
        challenge.invitationId,
      )
      if (!invitation) continue

      await this.dependencies.broker.publish(
        new FormalizationSignatureOtpDeliveryRequestedEvent({
          deliveryAttemptId: attempt.id,
          invitationId: invitation.id,
          channel: 'email',
          encryptedPayload: attempt.encryptedPayload,
          cipherKeyId: attempt.cipherKeyId,
          expiresAt: challenge.expiresAt,
          correlationId: challenge.id,
        }),
      )
      published += 1
    }

    return { published }
  }
}
