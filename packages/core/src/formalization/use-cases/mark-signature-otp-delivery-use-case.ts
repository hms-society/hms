import type { UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureOtpSendAttemptsRepository,
  FormalizationSignatureOtpChallengesRepository,
} from '../interfaces'
type Request = {
  readonly deliveryAttemptId: string
  readonly outcome: 'delivered' | 'failed'
  readonly providerMessageId?: string
  readonly occurredAt: Date
}
type Response = void
type Dependencies = {
  readonly attemptsRepository: FormalizationSignatureOtpSendAttemptsRepository
  readonly challengesRepository: FormalizationSignatureOtpChallengesRepository
}
export class MarkSignatureOtpDeliveryUseCase implements UseCase<Request, Response> {
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
        providerMessageId: request.providerMessageId,
        attempts: attempt.attempts + 1,
        deliveredAt: request.outcome === 'delivered' ? request.occurredAt : undefined,
      },
    })
    const challenge = await this.dependencies.challengesRepository.findById(
      attempt.challengeId,
    )
    if (!challenge || challenge.id !== attempt.challengeId) return
    await this.dependencies.challengesRepository.replace({
      challengeId: challenge.id,
      changes: {
        status: request.outcome === 'delivered' ? 'active' : 'delivery_failed',
        sentAt: request.outcome === 'delivered' ? request.occurredAt : undefined,
      },
    })
  }
}
