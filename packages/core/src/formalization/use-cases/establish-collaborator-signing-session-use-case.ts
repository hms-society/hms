import type { DatetimeProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureGatewaySession,
  FormalizationSignatureRecipient,
  FormalizationSignatureRequest,
} from '../domain/entities'
import type { FormalizationSignatureAuthenticationSource } from '../domain/structures'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '../interfaces'
import {
  SignatureCollaboratorIneligibleError,
  SignatureCollaboratorUnassignedError,
  SignatureSessionInvalidError,
} from '../domain/errors'

const COLLABORATOR_SIGNABLE_RECIPIENT_STATUSES = new Set([
  'invited',
  'authenticating',
  'locked',
  'authenticated',
  'reading',
  'signing',
])
const SIGNABLE_REQUEST_STATUSES = new Set([
  'sending',
  'sent',
  'in_progress',
  'partially_submitted',
])

type Request = {
  readonly flowToken: string
  readonly deviceToken: string
  readonly actorId: string
  readonly csrfToken: string
}
type Response = {
  readonly authenticatedToken: string
  readonly deviceToken: string
  readonly csrfToken: string
  readonly expiresAt: Date
}
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly invitationsRepository: FormalizationSignatureInvitationsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly idProvider: IdProvider
  readonly datetimeProvider: DatetimeProvider
  readonly hasher: SignatureSecretHasher
}

export class EstablishCollaboratorSigningSessionUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const now = this.dependencies.datetimeProvider.now()
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hasher.hash(request.flowToken),
    )
    if (
      session?.kind !== 'flow' ||
      session.status !== 'active' ||
      session.expiresAt <= now ||
      session.deviceSecretHash !== this.dependencies.hasher.hash(request.deviceToken) ||
      session.csrfHash !== this.dependencies.hasher.hash(request.csrfToken)
    )
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
    if (!SIGNABLE_REQUEST_STATUSES.has(signatureRequest.status))
      throw new SignatureSessionInvalidError()
    if (
      recipient.actorKind !== 'collaborator' ||
      recipient.personId !== request.actorId ||
      !COLLABORATOR_SIGNABLE_RECIPIENT_STATUSES.has(recipient.status)
    )
      throw new SignatureCollaboratorUnassignedError()

    const [assignments, activeInvitation, activeSessions] = await Promise.all([
      this.dependencies.assignmentsRepository.listByRecipientId(recipient.id),
      this.dependencies.invitationsRepository.findActiveByRecipientId(recipient.id),
      this.dependencies.sessionsRepository.findActiveByRecipientId(recipient.id),
    ])
    if (!this.hasExactAssignment(assignments, recipient.id, signatureRequest.id))
      throw new SignatureCollaboratorUnassignedError()
    const invitation =
      activeInvitation ??
      (await this.dependencies.invitationsRepository.findConsumedByRecipientAndRequest({
        recipientId: recipient.id,
        requestId: signatureRequest.id,
      }))
    if (
      !invitation ||
      invitation.requestId !== signatureRequest.id ||
      invitation.recipientId !== recipient.id ||
      invitation.expiresAt <= now
    )
      throw new SignatureSessionInvalidError()

    const source = await this.dependencies.sourceReader.findAuthenticationSource(
      request.actorId,
    )
    if (!this.isEligibleCollaborator(source, recipient))
      throw new SignatureCollaboratorIneligibleError()

    const authenticatedToken = this.dependencies.idProvider.generate()
    const authenticatedDevice = this.dependencies.idProvider.generate()
    const authenticatedCsrf = this.dependencies.idProvider.generate()
    const authenticated: FormalizationSignatureGatewaySession = {
      ...session,
      id: this.dependencies.idProvider.generate(),
      kind: 'authenticated',
      tokenHash: this.dependencies.hasher.hash(authenticatedToken),
      deviceSecretHash: this.dependencies.hasher.hash(authenticatedDevice),
      csrfHash: this.dependencies.hasher.hash(authenticatedCsrf),
      issuedAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      version: 1,
    }
    const result = await this.dependencies.transaction.establishCollaboratorSession({
      invitationId: invitation.id,
      expectedInvitationGeneration: invitation.generation,
      invitationChanges: { status: 'consumed', consumedAt: now },
      flowSessionId: session.id,
      expectedFlowSessionVersion: session.version,
      flowSessionChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'rotated',
      },
      authenticatedSessionIdsToRevoke: activeSessions
        .filter((item) => item.kind === 'authenticated')
        .map((item) => item.id),
      authenticatedSessionChanges: {
        status: 'revoked',
        revokedAt: now,
        revocationReason: 'rotated',
      },
      authenticatedSession: authenticated,
      recipientId: recipient.id,
      expectedRecipientVersion: recipient.version,
      recipientChanges: { status: 'authenticated' },
      requestId: signatureRequest.id,
      expectedRequestVersion: signatureRequest.version,
      requestChanges: ['sending', 'sent'].includes(signatureRequest.status)
        ? { status: 'in_progress' }
        : undefined,
    })
    if (result === 'conflict') throw new SignatureSessionInvalidError()
    return {
      authenticatedToken,
      deviceToken: authenticatedDevice,
      csrfToken: authenticatedCsrf,
      expiresAt: authenticated.expiresAt,
    }
  }

  private isBound(
    session: { requestId: string; recipientId: string; snapshotId: string },
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

  private hasExactAssignment(
    assignments: Awaited<
      ReturnType<FormalizationSignatureRecipientDocumentsRepository['listByRecipientId']>
    >,
    recipientId: string,
    requestId: string,
  ): boolean {
    const keys = assignments.map(
      (assignment) =>
        `${assignment.requestId}:${assignment.recipientId}:${assignment.requestDocumentId}`,
    )
    return (
      assignments.length > 0 &&
      new Set(keys).size === keys.length &&
      assignments.every(
        (assignment) =>
          assignment.requestId === requestId &&
          assignment.recipientId === recipientId &&
          assignment.requestDocumentId.length > 0,
      )
    )
  }

  private isEligibleCollaborator(
    source: FormalizationSignatureAuthenticationSource | null,
    recipient: FormalizationSignatureRecipient,
  ): boolean {
    return (
      !!source &&
      source.active &&
      source.personId === recipient.personId &&
      source.actorKind === 'collaborator' &&
      !!source.collaboratorRole
    )
  }
}
