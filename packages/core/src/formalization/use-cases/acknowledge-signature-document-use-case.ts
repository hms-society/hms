import type { DatetimeProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type { FormalizationSignatureDocumentAcknowledgement } from '../domain/entities'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '../interfaces'
import {
  SignatureCsrfInvalidError,
  SignatureDeviceMismatchError,
  SignatureSessionInvalidError,
} from '../domain/errors'

const ACKNOWLEDGEABLE_REQUEST_STATUSES = new Set(['in_progress', 'partially_submitted'])

type Request = {
  readonly sessionToken: string
  readonly deviceToken: string
  readonly csrfToken: string
  readonly requestDocumentId: string
  readonly expectedRequestVersion: number
  readonly acknowledged: true
  readonly sourceIpHash: string
  readonly userAgentHash: string
  readonly actorId?: string
}
type Response = {
  readonly requestDocumentId: string
  readonly acknowledgedAt: Date
}
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository
  readonly assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly idProvider: IdProvider
  readonly datetimeProvider: DatetimeProvider
  readonly hasher: SignatureSecretHasher
}

export class AcknowledgeSignatureDocumentUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}
  async execute(request: Request): Promise<Response> {
    if (
      request.acknowledged !== true ||
      request.sourceIpHash.length === 0 ||
      request.userAgentHash.length === 0
    )
      throw new SignatureSessionInvalidError()
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hasher.hash(request.sessionToken),
    )
    if (session?.kind !== 'authenticated' || session.status !== 'active')
      throw new SignatureSessionInvalidError()
    const now = this.dependencies.datetimeProvider.now()
    if (!Number.isFinite(session.expiresAt.getTime()) || session.expiresAt <= now)
      throw new SignatureSessionInvalidError()
    if (session.deviceSecretHash !== this.dependencies.hasher.hash(request.deviceToken))
      throw new SignatureDeviceMismatchError()
    if (session.csrfHash !== this.dependencies.hasher.hash(request.csrfToken))
      throw new SignatureCsrfInvalidError()
    const signatureRequest = await this.dependencies.requestsRepository.findById(
      session.requestId,
    )
    const document = await this.dependencies.documentsRepository.findById(
      request.requestDocumentId,
    )
    if (
      !signatureRequest ||
      signatureRequest.snapshotId !== session.snapshotId ||
      !document ||
      document.requestId !== session.requestId ||
      signatureRequest.version !== request.expectedRequestVersion ||
      !ACKNOWLEDGEABLE_REQUEST_STATUSES.has(signatureRequest.status) ||
      ['confirmed', 'rejected', 'cancelled', 'expired', 'failed'].includes(
        signatureRequest.status,
      )
    )
      throw new SignatureSessionInvalidError()
    const recipient = await this.dependencies.recipientsRepository.findById(
      session.recipientId,
    )
    if (
      !recipient ||
      recipient.requestId !== signatureRequest.id ||
      recipient.id !== session.recipientId ||
      !['authenticated', 'reading'].includes(recipient.status) ||
      ['confirmed', 'rejected', 'cancelled', 'expired'].includes(recipient.status)
    )
      throw new SignatureSessionInvalidError()
    const eligibility = await this.dependencies.sourceReader.findAuthenticationSource(
      recipient.personId,
    )
    if (
      !eligibility?.active ||
      eligibility.personId !== recipient.personId ||
      eligibility.actorKind !== recipient.actorKind ||
      (recipient.actorKind === 'collaborator' &&
        !['lawyer', 'paralegal', 'supervisor'].includes(
          eligibility.collaboratorRole ?? '',
        ))
    )
      throw new SignatureSessionInvalidError()
    if (recipient.actorKind === 'collaborator' && request.actorId !== recipient.personId)
      throw new SignatureSessionInvalidError()
    const assignments = await this.dependencies.assignmentsRepository.listByRecipientId(
      recipient.id,
    )
    const assignmentKeys = assignments.map(
      (assignment) =>
        `${assignment.requestId}:${assignment.recipientId}:${assignment.requestDocumentId}`,
    )
    if (
      assignments.length === 0 ||
      assignments.some(
        (assignment) =>
          !assignment.requestId ||
          !assignment.recipientId ||
          !assignment.requestDocumentId ||
          assignment.requestId !== signatureRequest.id ||
          assignment.recipientId !== recipient.id,
      ) ||
      new Set(assignmentKeys).size !== assignmentKeys.length
    )
      throw new SignatureSessionInvalidError()
    const existing =
      await this.dependencies.acknowledgementsRepository.findByRecipientDocumentAndSnapshot(
        {
          recipientId: recipient.id,
          requestDocumentId: document.id,
          snapshotId: session.snapshotId,
        },
      )
    if (
      existing &&
      (existing.requestId !== signatureRequest.id ||
        existing.recipientId !== recipient.id ||
        existing.requestDocumentId !== document.id ||
        existing.snapshotId !== session.snapshotId)
    )
      throw new SignatureSessionInvalidError()
    if (existing)
      return { requestDocumentId: document.id, acknowledgedAt: existing.acknowledgedAt }
    const acknowledgedAt = now
    const acknowledgement: FormalizationSignatureDocumentAcknowledgement = {
      id: this.dependencies.idProvider.generate(),
      requestId: session.requestId,
      requestDocumentId: document.id,
      recipientId: session.recipientId,
      snapshotId: session.snapshotId,
      sessionId: session.id,
      acknowledgedAt,
      sourceIpHash: request.sourceIpHash,
      userAgentHash: request.userAgentHash,
      createdAt: acknowledgedAt,
    }
    const result = await this.dependencies.transaction.acknowledgeDocument({
      sessionId: session.id,
      expectedSessionVersion: session.version,
      requestId: session.requestId,
      expectedRequestVersion: request.expectedRequestVersion,
      requestDocumentId: document.id,
      acknowledgement,
    })
    if (result === 'conflict') throw new SignatureSessionInvalidError()
    return {
      requestDocumentId: document.id,
      acknowledgedAt,
    }
  }
}
