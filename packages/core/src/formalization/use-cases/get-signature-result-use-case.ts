import type { DatetimeProvider, UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureGatewaySession,
  FormalizationSignatureRecipient,
  FormalizationSignatureRequest,
} from '../domain/entities'
import type { FormalizationSignatureResult } from '../domain/structures'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
} from '../interfaces'
import {
  SignatureReconciliationRequiredError,
  SignatureSessionInvalidError,
} from '../domain/errors'

type Request = { readonly sessionToken: string; readonly deviceToken: string }
type Response = FormalizationSignatureResult
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly protocolsRepository: FormalizationSignatureProtocolsRepository
  readonly datetimeProvider: DatetimeProvider
  readonly hash: (value: string) => string
}

const TERMINAL_STATUSES = new Set(['rejected', 'cancelled', 'expired'])

export class GetSignatureResultUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hash(request.sessionToken),
    )
    if (!this.isValidSession(session, request.deviceToken))
      throw new SignatureSessionInvalidError()

    const [signatureRequest, recipient] = await Promise.all([
      this.dependencies.requestsRepository.findById(session.requestId),
      this.dependencies.recipientsRepository.findById(session.recipientId),
    ])
    if (
      !signatureRequest ||
      !recipient ||
      !this.isBound(session, signatureRequest, recipient)
    )
      throw new SignatureSessionInvalidError()

    const status = this.deriveStatus(signatureRequest, recipient)
    if (status !== 'confirmed') {
      return {
        status,
        hmsReference: signatureRequest.id,
        ...(status === 'submitted' &&
        (recipient.submittedAt || signatureRequest.submittedAt)
          ? { occurredAt: recipient.submittedAt ?? signatureRequest.submittedAt }
          : {}),
      }
    }

    const protocol =
      await this.dependencies.protocolsRepository.findByRecipientAndRequest({
        recipientId: recipient.id,
        requestId: signatureRequest.id,
      })
    if (
      !protocol ||
      protocol.requestId !== signatureRequest.id ||
      protocol.recipientId !== recipient.id
    )
      throw new SignatureReconciliationRequiredError()

    return {
      status,
      hmsReference: signatureRequest.id,
      protocol: protocol.number,
      ...(recipient.submittedAt || signatureRequest.submittedAt
        ? { occurredAt: recipient.submittedAt ?? signatureRequest.submittedAt }
        : {}),
      ...(recipient.confirmedAt || signatureRequest.confirmedAt
        ? { confirmedAt: recipient.confirmedAt ?? signatureRequest.confirmedAt }
        : {}),
    }
  }

  private isValidSession(
    session: FormalizationSignatureGatewaySession | null,
    deviceToken: string,
  ): session is FormalizationSignatureGatewaySession & { kind: 'result' } {
    return (
      !!session &&
      session.kind === 'result' &&
      session.status === 'active' &&
      session.expiresAt > this.dependencies.datetimeProvider.now() &&
      session.deviceSecretHash === this.dependencies.hash(deviceToken)
    )
  }

  private isBound(
    session: FormalizationSignatureGatewaySession,
    signatureRequest: FormalizationSignatureRequest | null,
    recipient: FormalizationSignatureRecipient | null,
  ): signatureRequest is FormalizationSignatureRequest {
    return (
      !!signatureRequest &&
      !!recipient &&
      signatureRequest.id === session.requestId &&
      signatureRequest.snapshotId === session.snapshotId &&
      recipient.id === session.recipientId &&
      recipient.requestId === signatureRequest.id
    )
  }

  private deriveStatus(
    signatureRequest: FormalizationSignatureRequest,
    recipient: FormalizationSignatureRecipient,
  ): FormalizationSignatureResult['status'] {
    if (TERMINAL_STATUSES.has(recipient.status))
      return recipient.status as 'rejected' | 'cancelled' | 'expired'
    if (TERMINAL_STATUSES.has(signatureRequest.status))
      return signatureRequest.status as 'rejected' | 'cancelled' | 'expired'
    if (recipient.status === 'confirmed' && signatureRequest.status === 'confirmed')
      return 'confirmed'
    if (
      recipient.status === 'reconciliation_required' ||
      signatureRequest.status === 'reconciliation_required'
    )
      return 'reconciliation_pending'
    if (
      recipient.status === 'submitted' ||
      signatureRequest.status === 'submitted' ||
      signatureRequest.status === 'partially_submitted'
    )
      return 'submitted'
    return 'reconciliation_pending'
  }
}
