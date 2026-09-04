import type { Broker, UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureInvitationSendAttemptsRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureRecipientsRepository,
} from '../interfaces'
import { FormalizationSignatureInvitationReadyEvent } from '../domain/events'

type Request = { readonly occurredAt: Date; readonly limit: number }
type Response = { readonly published: number }
type Dependencies = {
  readonly attemptsRepository: FormalizationSignatureInvitationSendAttemptsRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly broker: Broker
}

export class ReconcileFormalizationSignatureInvitationDeliveriesUseCase
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
      const invitation = await this.dependencies.invitationsRepository.findById(
        attempt.invitationId,
      )
      if (!invitation) continue
      const recipient = await this.dependencies.recipientsRepository.findById(
        invitation.recipientId,
      )
      if (!recipient) continue

      await this.dependencies.broker.publish(
        new FormalizationSignatureInvitationReadyEvent({
          deliveryAttemptId: attempt.id,
          invitationId: invitation.id,
          recipientId: recipient.id,
          personId: recipient.personId,
          channel: recipient.deliveryChannel,
          encryptedPayload: attempt.encryptedPayload,
          cipherKeyId: attempt.cipherKeyId,
          expiresAt: invitation.expiresAt,
          correlationId: attempt.id,
        }),
      )
      published += 1
    }

    return { published }
  }
}
