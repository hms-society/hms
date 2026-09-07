import type { DatetimeProvider, UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureGatewaySession,
  FormalizationSignatureRecipient,
  FormalizationSignatureRequest,
  FormalizationSignatureRequestDocument,
} from '../domain/entities'
import type {
  FormalizationSignatureAuthenticationSource,
  FormalizationSignatureGatewayContext,
  FormalizationSignatureResult,
} from '../domain/structures'
import type {
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '../interfaces'
import {
  SignatureDeviceMismatchError,
  SignatureReconciliationRequiredError,
  SignatureSessionInvalidError,
} from '../domain/errors'

const COLLABORATOR_LOGIN_PATH = '/login?returnTo=%2Fassinaturas%2Facesso'
const TERMINAL_STATUSES = new Set(['rejected', 'cancelled', 'expired'])
const SIGNABLE_REQUEST_STATUSES = new Set([
  'sending',
  'sent',
  'in_progress',
  'partially_submitted',
])
const READABLE_RECIPIENT_STATUSES = new Set(['authenticated', 'reading', 'signing'])
const FLOW_RECIPIENT_STATUSES = new Set([
  'invited',
  'authenticating',
  'locked',
  'authenticated',
  'reading',
  'signing',
])
const READABLE_DOCUMENT_STATUSES = new Set([
  'provisioned',
  'delivery_pending',
  'sent',
  'submitted',
  'reconciliation_required',
])

type Request = {
  readonly sessionToken: string
  readonly deviceToken: string
  readonly actorId?: string
}
type ContextWithoutCsrf = FormalizationSignatureGatewayContext extends infer Context
  ? Context extends { readonly csrfToken?: string }
    ? Omit<Context, 'csrfToken'>
    : never
  : never
type BuiltResponse = {
  readonly context: ContextWithoutCsrf
  readonly csrfToken?: string
}
type Response = FormalizationSignatureGatewayContext
type SecretGenerator = { generate(): string }
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly protocolsRepository: FormalizationSignatureProtocolsRepository
  readonly assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository
  readonly bindingsRepository: FormalizationSignatureProxyBindingsRepository
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly hasher: SignatureSecretHasher
  readonly secretGenerator: SecretGenerator
  readonly datetimeProvider: DatetimeProvider
}

export class GetSignatureGatewayContextUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const response = await this.buildContext(request)
    return (
      response.csrfToken
        ? { ...response.context, csrfToken: response.csrfToken }
        : response.context
    ) as Response
  }

  private async buildContext(request: Request): Promise<BuiltResponse> {
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hasher.hash(request.sessionToken),
    )
    const now = this.dependencies.datetimeProvider.now()
    if (
      session?.status !== 'active' ||
      !Number.isFinite(session.expiresAt.getTime()) ||
      session.expiresAt <= now
    )
      throw new SignatureSessionInvalidError()
    if (session.deviceSecretHash !== this.dependencies.hasher.hash(request.deviceToken))
      throw new SignatureDeviceMismatchError()

    const [signatureRequest, recipient] = await Promise.all([
      this.dependencies.requestsRepository.findById(session.requestId),
      this.dependencies.recipientsRepository.findById(session.recipientId),
    ])
    if (
      !signatureRequest ||
      !recipient ||
      !this.isBound(session, signatureRequest, recipient)
    )
      return this.unavailable('document_unavailable')

    const csrfToken = this.dependencies.secretGenerator.generate()
    if (
      !(await this.dependencies.sessionsRepository.replace({
        sessionId: session.id,
        expectedVersion: session.version,
        changes: { csrfHash: this.dependencies.hasher.hash(csrfToken) },
      }))
    )
      throw new SignatureSessionInvalidError()

    if (session.kind === 'flow')
      return this.getFlowContext(signatureRequest, recipient, csrfToken)

    const result = await this.getResultContext(session.kind, signatureRequest, recipient)
    if (result) return { context: result, csrfToken }

    if (
      TERMINAL_STATUSES.has(signatureRequest.status) ||
      TERMINAL_STATUSES.has(recipient.status)
    )
      return {
        context: {
          step: 'unavailable',
          reason: this.terminalStatus(signatureRequest.status, recipient.status),
          result: this.safeResult(
            this.terminalStatus(signatureRequest.status, recipient.status),
            signatureRequest.id,
          ),
        },
        csrfToken,
      }

    if (
      !SIGNABLE_REQUEST_STATUSES.has(signatureRequest.status) ||
      !READABLE_RECIPIENT_STATUSES.has(recipient.status)
    )
      return this.unavailable('document_unavailable', csrfToken)
    if (
      recipient.actorKind === 'collaborator' &&
      request.actorId !== recipient.personId
    )
      return this.unavailable('access_unavailable', csrfToken)

    const source = await this.dependencies.sourceReader.findAuthenticationSource(
      recipient.personId,
    )
    if (!this.isLiveIdentity(recipient, source, request.actorId))
      return this.unavailable('access_unavailable', csrfToken)
    if (
      recipient.actorKind === 'collaborator' &&
      !(await this.hasExactAssignment(recipient.id, signatureRequest.id))
    )
      return this.unavailable('access_unavailable', csrfToken)

    const documents = await this.dependencies.documentsRepository.listByRequestId(
      signatureRequest.id,
    )
    const mapped = await this.mapDocuments(signatureRequest, documents)
    if (!mapped) return this.unavailable('document_unavailable', csrfToken)

    const acknowledgements =
      await this.dependencies.acknowledgementsRepository.listByRecipientAndSnapshot({
        recipientId: recipient.id,
        snapshotId: signatureRequest.snapshotId,
      })
    const acknowledgedDocumentIds = acknowledgements
      .filter(
        (acknowledgement) =>
          acknowledgement.requestId === signatureRequest.id &&
          acknowledgement.recipientId === recipient.id &&
          acknowledgement.snapshotId === signatureRequest.snapshotId &&
          mapped.some((document) => document.id === acknowledgement.requestDocumentId),
      )
      .map((acknowledgement) => acknowledgement.requestDocumentId)
    const uniqueAcknowledgedDocumentIds = [...new Set(acknowledgedDocumentIds)]
    if (recipient.status === 'signing') {
      const bindings = await this.dependencies.bindingsRepository.findActiveByRecipientId(
        recipient.id,
      )
      if (
        uniqueAcknowledgedDocumentIds.length !== mapped.length ||
        bindings.length !== 1 ||
        bindings[0]?.status !== 'active' ||
        bindings[0].sessionId !== session.id ||
        bindings[0].requestId !== signatureRequest.id ||
        bindings[0].recipientId !== recipient.id ||
        !Number.isFinite(bindings[0].expiresAt.getTime()) ||
        bindings[0].expiresAt <= now
      )
        return this.unavailable('access_unavailable', csrfToken)
    }
    return {
      context: {
        step: 'reading',
        documents: mapped,
        acknowledgedDocumentIds: uniqueAcknowledgedDocumentIds,
        requestVersion: signatureRequest.version,
      },
      csrfToken,
    }
  }

  private async getFlowContext(
    signatureRequest: FormalizationSignatureRequest,
    recipient: FormalizationSignatureRecipient,
    csrfToken: string,
  ): Promise<BuiltResponse> {
    if (
      TERMINAL_STATUSES.has(signatureRequest.status) ||
      TERMINAL_STATUSES.has(recipient.status)
    )
      return this.unavailable('access_unavailable', csrfToken)
    if (!SIGNABLE_REQUEST_STATUSES.has(signatureRequest.status))
      return this.unavailable('access_unavailable', csrfToken)
    if (!FLOW_RECIPIENT_STATUSES.has(recipient.status))
      return this.unavailable('access_unavailable', csrfToken)

    const source = await this.dependencies.sourceReader.findAuthenticationSource(
      recipient.personId,
    )
    if (!source?.active || source.personId !== recipient.personId)
      return this.unavailable('access_unavailable', csrfToken)
    if (recipient.actorKind === 'collaborator') {
      if (
        !this.isLiveIdentity(recipient, source, undefined, false) ||
        !(await this.hasExactAssignment(recipient.id, signatureRequest.id))
      )
        return this.unavailable('access_unavailable', csrfToken)
      return {
        context: { step: 'collaborator_login', loginPath: COLLABORATOR_LOGIN_PATH },
        csrfToken,
      }
    }
    if (
      source.actorKind !== 'client' ||
      source.channels.length !== 1 ||
      source.channels[0]?.kind !== 'email'
    )
      return this.unavailable('no_channel', csrfToken)
    return { context: { step: 'choose_channel', channels: source.channels }, csrfToken }
  }

  private async getResultContext(
    kind: FormalizationSignatureGatewaySession['kind'],
    signatureRequest: FormalizationSignatureRequest,
    recipient: FormalizationSignatureRecipient,
  ): Promise<ContextWithoutCsrf | null> {
    if (kind !== 'result') return null
    const status = this.deriveResultStatus(signatureRequest, recipient)
    if (status === 'confirmed') {
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
        step: 'confirmed',
        result: { status, hmsReference: signatureRequest.id, protocol: protocol.number },
      }
    }
    if (status === 'submitted')
      return {
        step: 'submitted',
        result: { status, hmsReference: signatureRequest.id },
      }
    if (status === 'reconciliation_pending')
      return {
        step: 'unavailable',
        reason: 'provider_unavailable',
        result: this.safeResult(status, signatureRequest.id),
      }
    return {
      step: 'unavailable',
      reason: status,
      result: this.safeResult(status, signatureRequest.id),
    }
  }

  private deriveResultStatus(
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

  private isLiveIdentity(
    recipient: FormalizationSignatureRecipient,
    source: FormalizationSignatureAuthenticationSource | null,
    actorId?: string,
    requireCollaboratorActor = true,
  ): boolean {
    const permittedCollaborator =
      !!source?.collaboratorRole &&
      ['lawyer', 'paralegal', 'supervisor'].includes(source.collaboratorRole)
    return (
      !!source &&
      source.active &&
      source.personId === recipient.personId &&
      source.actorKind === recipient.actorKind &&
      (recipient.actorKind !== 'collaborator' ||
        (!requireCollaboratorActor && !actorId && permittedCollaborator) ||
        (!!actorId && actorId === recipient.personId && permittedCollaborator))
    )
  }

  private async hasExactAssignment(
    recipientId: string,
    requestId: string,
  ): Promise<boolean> {
    const assignments =
      await this.dependencies.assignmentsRepository.listByRecipientId(recipientId)
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

  private async mapDocuments(
    signatureRequest: FormalizationSignatureRequest,
    documents: readonly FormalizationSignatureRequestDocument[],
  ) {
    if (
      documents.length === 0 ||
      new Set(documents.map((document) => document.id)).size !== documents.length ||
      new Set(documents.map((document) => document.position)).size !== documents.length ||
      documents.some(
        (document) =>
          document.requestId !== signatureRequest.id ||
          !READABLE_DOCUMENT_STATUSES.has(document.status) ||
          !document.unsignedPrivateFileId ||
          !document.unsignedSha256 ||
          document.byteCount <= 0 ||
          document.pageCount <= 0,
      )
    )
      return null

    const mapped = await Promise.all(
      [...documents]
        .sort((left, right) => left.position - right.position)
        .map(async (document) => {
          const sourceDocument = await this.dependencies.sourceReader.findDocumentVersion(
            signatureRequest.formalizationId,
            document.sourceDocumentVersionId,
          )
          return sourceDocument &&
            sourceDocument.documentId === document.sourceDocumentId &&
            sourceDocument.documentVersionId === document.sourceDocumentVersionId &&
            sourceDocument.name
            ? {
                id: document.id,
                title: sourceDocument.name,
                position: document.position,
                pageCount: document.pageCount,
              }
            : null
        }),
    )
    return mapped.every((document) => document !== null)
      ? mapped.filter(
          (document): document is NonNullable<typeof document> => document !== null,
        )
      : null
  }

  private terminalStatus(
    requestStatus: string,
    recipientStatus: string,
  ): 'rejected' | 'cancelled' | 'expired' {
    if (recipientStatus === 'rejected' || requestStatus === 'rejected') return 'rejected'
    if (recipientStatus === 'cancelled' || requestStatus === 'cancelled')
      return 'cancelled'
    return 'expired'
  }

  private safeResult(
    status: FormalizationSignatureResult['status'],
    hmsReference: string,
  ): FormalizationSignatureResult {
    return { status, hmsReference }
  }

  private unavailable(
    reason: 'document_unavailable' | 'no_channel' | 'access_unavailable',
    csrfToken?: string,
  ): BuiltResponse {
    return {
      context: { step: 'unavailable', reason },
      ...(csrfToken ? { csrfToken } : {}),
    }
  }
}
