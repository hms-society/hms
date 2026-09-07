import type { UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureInvitationSendAttemptsRepository,
  FormalizationSignatureInvitationsRepository,
} from '../interfaces'

type Request = {
  readonly deliveryAttemptId: string
  readonly outcome: 'delivered' | 'failed'
  readonly communicationMessageId?: string
  readonly occurredAt: Date
}
type Response = void
type Dependencies = {
  readonly attemptsRepository: FormalizationSignatureInvitationSendAttemptsRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
}
export class MarkFormalizationSignatureInvitationDeliveryUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}
  async execute(request: Request): Promise<void> {
    const attempt = await this.dependencies.attemptsRepository.findById(
      request.deliveryAttemptId,
    )
    if (!attempt || attempt.status !== 'pending') return
    await this.dependencies.attemptsRepository.replace({
      attemptId: attempt.id,
      changes: {
        status: request.outcome,
        communicationMessageId: request.communicationMessageId,
        deliveredAt: request.outcome === 'delivered' ? request.occurredAt : undefined,
        attempts: attempt.attempts + 1,
        updatedAt: request.occurredAt,
      },
    })
    const invitation = await this.dependencies.invitationsRepository.findById(
      attempt.invitationId,
    )
    if (!invitation) return
    await this.dependencies.invitationsRepository.replace({
      invitationId: invitation.id,
      changes: {
        deliveryStatus: request.outcome,
        communicationMessageId: request.communicationMessageId,
        deliveredAt: request.outcome === 'delivered' ? request.occurredAt : undefined,
      },
    })
  }
}
