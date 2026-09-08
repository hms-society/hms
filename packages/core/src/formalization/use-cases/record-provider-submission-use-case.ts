import type { Broker, DatetimeProvider, UseCase } from '../../shared/interfaces'
import {
  SignatureProxyContractViolationError,
  SignatureSessionInvalidError,
} from '../domain/errors'
import {
  FormalizationSignatureRecipientSubmittedEvent,
  FormalizationSignatureReconciliationRequestedEvent,
} from '../domain/events'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
} from '../interfaces'

type Request = {
  readonly requestId: string
  readonly recipientId: string
  readonly sessionId: string
  readonly bindingId: string
  readonly expectedBindingAliasHash: string
  readonly providerObservationId: string
  readonly expectedRecipientVersion: number
  readonly expectedSessionVersion: number
  readonly submittedAt: Date
}
type Response = void
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly bindingsRepository: FormalizationSignatureProxyBindingsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly datetimeProvider: DatetimeProvider
  readonly broker: Broker
}

export class RecordProviderSubmissionUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<void> {
    const expectedObservationId = await sha256(`submission:${request.bindingId}`)
    if (
      request.providerObservationId !== expectedObservationId ||
      !request.expectedBindingAliasHash
    )
      throw new SignatureProxyContractViolationError()

    const [signatureRequest, recipient, sessions, binding, documents, assignments] =
      await Promise.all([
        this.dependencies.requestsRepository.findById(request.requestId),
        this.dependencies.recipientsRepository.findById(request.recipientId),
        this.dependencies.sessionsRepository.findActiveByRecipientId(request.recipientId),
        this.dependencies.bindingsRepository.findByAliasHash(
          request.expectedBindingAliasHash,
        ),
        this.dependencies.documentsRepository.listByRequestId(request.requestId),
        this.dependencies.assignmentsRepository.listByRecipientId(request.recipientId),
      ])
    const session = sessions.find((item) => item.id === request.sessionId)
    const now = this.dependencies.datetimeProvider.now()
    const durableReplay =
      !!session &&
      !!recipient &&
      !!binding &&
      session.kind === 'result' &&
      recipient.submissionObservationId === request.providerObservationId &&
      ['submitted', 'reconciliation_required', 'confirmed'].includes(recipient.status) &&
      binding.status === 'revoked' &&
      binding.revocationReason === 'submitted'
    if (
      !signatureRequest ||
      !recipient ||
      !session ||
      signatureRequest.id !== request.requestId ||
      recipient.id !== request.recipientId ||
      recipient.requestId !== signatureRequest.id ||
      session.requestId !== signatureRequest.id ||
      session.recipientId !== recipient.id ||
      session.snapshotId !== signatureRequest.snapshotId ||
      session.status !== 'active' ||
      !Number.isFinite(session.expiresAt.getTime()) ||
      session.expiresAt <= now ||
      (!durableReplay && recipient.version !== request.expectedRecipientVersion) ||
      (!durableReplay && session.version !== request.expectedSessionVersion) ||
      !['authenticated', 'result'].includes(session.kind) ||
      ![
        'in_progress',
        'partially_submitted',
        'submitted',
        'reconciliation_required',
        'confirmed',
      ].includes(signatureRequest.status) ||
      (!durableReplay && recipient.status !== 'signing')
    )
      throw new SignatureSessionInvalidError()
    if (
      !binding ||
      binding.id !== request.bindingId ||
      binding.aliasHash !== request.expectedBindingAliasHash ||
      binding.sessionId !== session.id ||
      binding.requestId !== signatureRequest.id ||
      binding.recipientId !== recipient.id ||
      (session.kind === 'authenticated' &&
        (binding.status !== 'active' || binding.expiresAt <= now)) ||
      (session.kind === 'result' && !durableReplay)
    )
      throw new SignatureProxyContractViolationError()
    if (
      documents.length === 0 ||
      new Set(documents.map((document) => document.id)).size !== documents.length ||
      documents.some((document) => document.requestId !== signatureRequest.id)
    )
      throw new SignatureProxyContractViolationError()
    const documentIds = new Set(documents.map((document) => document.id))
    if (
      assignments.length === 0 ||
      new Set(assignments.map((assignment) => assignment.id)).size !==
        assignments.length ||
      new Set(
        assignments.map(
          (assignment) => `${assignment.recipientId}:${assignment.requestDocumentId}`,
        ),
      ).size !== assignments.length ||
      assignments.some(
        (assignment) =>
          !assignment.id ||
          assignment.requestId !== signatureRequest.id ||
          assignment.recipientId !== recipient.id ||
          !assignment.requestDocumentId ||
          !documentIds.has(assignment.requestDocumentId),
      )
    )
      throw new SignatureProxyContractViolationError()
    const assignedDocumentIds = new Set(
      assignments.map((assignment) => assignment.requestDocumentId),
    )
    const assignedDocuments = documents.filter((document) =>
      assignedDocumentIds.has(document.id),
    )

    const outcome = await this.dependencies.transaction.recordSubmission({
      requestId: signatureRequest.id,
      recipientId: recipient.id,
      expectedRecipientVersion: request.expectedRecipientVersion,
      sessionId: session.id,
      expectedSessionVersion: request.expectedSessionVersion,
      bindingId: binding.id,
      expectedBindingAliasHash: request.expectedBindingAliasHash,
      providerObservationId: request.providerObservationId,
      submittedAt: request.submittedAt,
    })
    if (outcome === 'conflict') throw new SignatureProxyContractViolationError()
    if (outcome === 'duplicate') {
      await this.dependencies.broker.publish(
        new FormalizationSignatureReconciliationRequestedEvent({
          requestId: signatureRequest.id,
          reason: 'ambiguous_submission',
          earliestRunAt: request.submittedAt,
        }),
      )
      return
    }

    await this.dependencies.broker.publish(
      new FormalizationSignatureRecipientSubmittedEvent({
        requestId: signatureRequest.id,
        recipientId: recipient.id,
        requestDocumentIds: assignedDocuments.map((document) => document.id),
        providerObservationId: request.providerObservationId,
        submittedAt: request.submittedAt,
      }),
    )
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
