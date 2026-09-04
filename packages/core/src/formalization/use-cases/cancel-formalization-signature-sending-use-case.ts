import type {
  Broker,
  DatetimeProvider,
  IdProvider,
  UseCase,
} from '../../shared/interfaces'
import type { FormalizationSignatureCancellationAttempt } from '../domain/entities'
import { FormalizationSignatureRequestCancellationRequestedEvent } from '../domain/events/formalization-signature-request-cancellation-requested-event'
import { FormalizationSignatureRequestStatus } from '../domain/structures'
import { FormalizationSignatureRequestConflictError } from '../domain/errors'
import type {
  FormalizationSignatureCancellationAttemptsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
} from '../interfaces'

type Request = {
  readonly requestId: string
  readonly actorId: string
  readonly expectedRequestVersion: number
  readonly expectedFormalizationVersion: number
}

type Response = {
  readonly requestId: string
  readonly outcome: 'scheduled' | 'already_terminal'
  readonly cancellationPending: boolean
}

type Dependencies = {
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly cancellationsRepository: FormalizationSignatureCancellationAttemptsRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly bindingsRepository: FormalizationSignatureProxyBindingsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly idProvider: IdProvider
  readonly datetimeProvider: DatetimeProvider
  readonly broker: Broker
}

const terminalStatuses = new Set<string>([
  FormalizationSignatureRequestStatus.confirmed,
  FormalizationSignatureRequestStatus.rejected,
  FormalizationSignatureRequestStatus.cancelled,
  FormalizationSignatureRequestStatus.expired,
])

export class CancelFormalizationSignatureSendingUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const signatureRequest = await this.dependencies.requestsRepository.findById(
      request.requestId,
    )
    if (!signatureRequest) throw new FormalizationSignatureRequestConflictError()
    if (terminalStatuses.has(signatureRequest.status)) {
      return {
        requestId: signatureRequest.id,
        outcome: 'already_terminal',
        cancellationPending: false,
      }
    }

    const recipients =
      (await this.dependencies.recipientsRepository.listByRequestId(
        signatureRequest.id,
      )) ?? []
    const invitationIdsToRevoke: string[] = []
    const sessionIdsToRevoke: string[] = []
    const bindingIdsToRevoke: string[] = []
    for (const recipient of recipients) {
      const invitation =
        await this.dependencies.invitationsRepository.findActiveByRecipientId(
          recipient.id,
        )
      if (invitation) invitationIdsToRevoke.push(invitation.id)
      const sessions = await this.dependencies.sessionsRepository.findActiveByRecipientId(
        recipient.id,
      )
      sessionIdsToRevoke.push(...sessions.map((session) => session.id))
      const bindings = await this.dependencies.bindingsRepository.findActiveByRecipientId(
        recipient.id,
      )
      bindingIdsToRevoke.push(...bindings.map((binding) => binding.id))
    }

    const now = this.dependencies.datetimeProvider.now()
    const cancellationAttempt: FormalizationSignatureCancellationAttempt = {
      id: this.dependencies.idProvider.generate(),
      requestId: signatureRequest.id,
      attemptToken: this.dependencies.idProvider.generate(),
      status: 'pending',
      attempts: 0,
      requestedBy: request.actorId,
      requestedAt: now,
      updatedAt: now,
    }
    const result = await this.dependencies.transaction.requestCancellation({
      requestId: signatureRequest.id,
      expectedRequestVersion: request.expectedRequestVersion,
      requestChanges: { cancellationRequestedAt: now },
      cancellationAttempt,
      invitationIdsToRevoke,
      invitationChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'cancelled',
      },
      sessionIdsToRevoke,
      sessionChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'cancelled',
      },
      bindingIdsToRevoke,
      bindingChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'cancelled',
      },
      formalizationId: signatureRequest.formalizationId,
      expectedFormalizationVersion: request.expectedFormalizationVersion,
      formalizationChanges: {
        signatureRequestId: signatureRequest.id,
        signatureStatus: FormalizationSignatureRequestStatus.reconciliationRequired,
      },
    })
    if (result === 'conflict') throw new FormalizationSignatureRequestConflictError()
    if (result === 'already_terminal') {
      return {
        requestId: signatureRequest.id,
        outcome: 'already_terminal',
        cancellationPending: false,
      }
    }

    await this.dependencies.broker.publish(
      new FormalizationSignatureRequestCancellationRequestedEvent({
        requestId: signatureRequest.id,
        cancellationAttemptId: cancellationAttempt.id,
        occurredAt: now,
        correlationId: signatureRequest.id,
      }),
    )
    return {
      requestId: signatureRequest.id,
      outcome: 'scheduled',
      cancellationPending: true,
    }
  }
}
