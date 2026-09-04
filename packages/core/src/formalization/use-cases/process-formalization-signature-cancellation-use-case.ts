import type { UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureCancellationAttemptsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  SignatureProvider,
} from '../interfaces'

type Request = {
  readonly cancellationAttemptId: string
  readonly attemptToken: string
  readonly occurredAt: Date
  readonly processedAt: Date
}
type Response = {
  readonly outcome: 'cancelled' | 'already_terminal' | 'retry_required'
}
type Dependencies = {
  readonly attemptsRepository: FormalizationSignatureCancellationAttemptsRepository
  readonly resourcesRepository: FormalizationSignatureProviderResourcesRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly provider: SignatureProvider
}

const TERMINAL_REQUEST_STATUSES = new Set([
  'confirmed',
  'rejected',
  'cancelled',
  'expired',
  'failed',
])

export class ProcessFormalizationSignatureCancellationUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const existingAttempt = await this.dependencies.attemptsRepository.findById(
      request.cancellationAttemptId,
    )
    if (!existingAttempt || existingAttempt.attemptToken !== request.attemptToken)
      return { outcome: 'retry_required' }
    if (existingAttempt.status === 'cancelled') return { outcome: 'already_terminal' }
    const attempt = await this.dependencies.attemptsRepository.claim({
      attemptId: request.cancellationAttemptId,
      attemptToken: request.attemptToken,
      now: request.processedAt,
      leaseExpiresAt: new Date(request.processedAt.getTime() + 30_000),
    })
    if (!attempt) return { outcome: 'retry_required' }

    const [signatureRequest, recipients, documents, resource] = await Promise.all([
      this.dependencies.requestsRepository.findById(attempt.requestId),
      this.dependencies.recipientsRepository.listByRequestId(attempt.requestId),
      this.dependencies.documentsRepository.listByRequestId(attempt.requestId),
      this.dependencies.resourcesRepository.findByRequestId(attempt.requestId),
    ])
    if (
      !signatureRequest ||
      signatureRequest.id !== attempt.requestId ||
      recipients.some((recipient) => recipient.requestId !== signatureRequest.id) ||
      documents.some((document) => document.requestId !== signatureRequest.id)
    )
      return { outcome: 'retry_required' }
    if (TERMINAL_REQUEST_STATUSES.has(signatureRequest.status)) {
      await this.completeAttempt(attempt.id, attempt.attempts, request.occurredAt)
      return { outcome: 'already_terminal' }
    }

    let providerOutcome: 'cancelled' | 'already_terminal' = 'already_terminal'
    if (resource) {
      if (resource.requestId !== signatureRequest.id) return { outcome: 'retry_required' }
      try {
        providerOutcome = await this.dependencies.provider.cancelEnvelope({
          providerEnvelopeId: resource.providerEnvelopeId,
        })
      } catch {
        await this.failAttempt(attempt.id, attempt.attempts, request.occurredAt)
        return { outcome: 'retry_required' }
      }
    }

    const derived = await this.dependencies.transaction.deriveTerminalOutcome({
      requestId: signatureRequest.id,
      expectedRequestVersion: signatureRequest.version,
      recipientChanges: recipients
        .filter((recipient) => recipient.status !== 'confirmed')
        .map((recipient) => ({
          recipientId: recipient.id,
          expectedVersion: recipient.version,
          changes: { status: 'cancelled' as const, terminalAt: request.occurredAt },
        })),
      requestDocumentChanges: documents
        .filter((document) => document.status !== 'confirmed')
        .map((document) => ({
          requestDocumentId: document.id,
          expectedVersion: document.version,
          changes: { status: 'cancelled' as const, terminalAt: request.occurredAt },
        })),
      terminalAt: request.occurredAt,
    })
    if (derived === 'conflict') {
      await this.failAttempt(attempt.id, attempt.attempts, request.occurredAt)
      return { outcome: 'retry_required' }
    }
    await this.completeAttempt(attempt.id, attempt.attempts, request.occurredAt)
    return {
      outcome:
        providerOutcome === 'cancelled' && derived === 'applied'
          ? 'cancelled'
          : 'already_terminal',
    }
  }

  private completeAttempt(attemptId: string, attempts: number, occurredAt: Date) {
    return this.dependencies.attemptsRepository.replace({
      attemptId,
      changes: {
        status: 'cancelled',
        attempts: attempts + 1,
        leaseExpiresAt: occurredAt,
        updatedAt: occurredAt,
      },
    })
  }

  private failAttempt(attemptId: string, attempts: number, occurredAt: Date) {
    return this.dependencies.attemptsRepository.replace({
      attemptId,
      changes: {
        status: 'failed',
        attempts: attempts + 1,
        leaseExpiresAt: occurredAt,
        nextAttemptAt: new Date(occurredAt.getTime() + 30_000),
        lastFailureCode: 'retry_required',
        updatedAt: occurredAt,
      },
    })
  }
}
