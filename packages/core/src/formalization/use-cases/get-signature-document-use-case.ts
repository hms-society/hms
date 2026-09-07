import type { DatetimeProvider, UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureRecipient,
  FormalizationSignatureRequest,
  FormalizationSignatureRequestDocument,
} from '../domain/entities'
import type { FormalizationSignatureAuthenticationSource } from '../domain/structures'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureSourceReader,
  SignatureSecretHasher,
} from '../interfaces'
import {
  SignatureDocumentUnavailableError,
  SignatureSessionInvalidError,
} from '../domain/errors'

const SIGNABLE_REQUEST_STATUSES = new Set(['sent', 'in_progress', 'partially_submitted'])
const READABLE_RECIPIENT_STATUSES = new Set(['authenticated', 'reading', 'signing'])
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
  readonly requestDocumentId: string
  readonly actorId?: string
}
type Response = {
  readonly privateFileId: string
  readonly title: string
  readonly mediaType: 'application/pdf'
  readonly byteCount: number
  readonly sha256: string
}
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly hasher: SignatureSecretHasher
  readonly datetimeProvider: DatetimeProvider
}

export class GetSignatureDocumentUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hasher.hash(request.sessionToken),
    )
    if (
      session?.kind !== 'authenticated' ||
      session.status !== 'active' ||
      session.expiresAt <= this.dependencies.datetimeProvider.now()
    )
      throw new SignatureSessionInvalidError()
    if (session.deviceSecretHash !== this.dependencies.hasher.hash(request.deviceToken))
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
      throw new SignatureDocumentUnavailableError()
    if (
      !SIGNABLE_REQUEST_STATUSES.has(signatureRequest.status) ||
      !READABLE_RECIPIENT_STATUSES.has(recipient.status) ||
      (recipient.actorKind === 'collaborator' &&
        request.actorId !== recipient.personId)
    )
      throw new SignatureDocumentUnavailableError()

    const source = await this.dependencies.sourceReader.findAuthenticationSource(
      recipient.personId,
    )
    if (!this.isLiveIdentity(recipient, source, request.actorId))
      throw new SignatureDocumentUnavailableError()
    if (!(await this.hasExactAssignment(recipient.id, signatureRequest.id)))
      throw new SignatureDocumentUnavailableError()

    const document = await this.dependencies.documentsRepository.findById(
      request.requestDocumentId,
    )
    if (!this.isReadableDocument(document, signatureRequest))
      throw new SignatureDocumentUnavailableError()

    const sourceDocument = await this.dependencies.sourceReader.findDocumentVersion(
      signatureRequest.formalizationId,
      document.sourceDocumentVersionId,
    )
    if (
      !sourceDocument ||
      sourceDocument.documentId !== document.sourceDocumentId ||
      sourceDocument.documentVersionId !== document.sourceDocumentVersionId ||
      !sourceDocument.name
    )
      throw new SignatureDocumentUnavailableError()

    return {
      privateFileId: document.unsignedPrivateFileId,
      title: sourceDocument.name,
      mediaType: 'application/pdf',
      byteCount: document.byteCount,
      sha256: document.unsignedSha256,
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

  private isLiveIdentity(
    recipient: FormalizationSignatureRecipient,
    source: FormalizationSignatureAuthenticationSource | null,
    actorId?: string,
  ): boolean {
    return (
      !!source &&
      source.active &&
      source.personId === recipient.personId &&
      source.actorKind === recipient.actorKind &&
      (recipient.actorKind !== 'collaborator' ||
        (!!actorId && actorId === recipient.personId && !!source.collaboratorRole))
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

  private isReadableDocument(
    document: FormalizationSignatureRequestDocument | null,
    signatureRequest: FormalizationSignatureRequest,
  ): document is FormalizationSignatureRequestDocument {
    return (
      !!document &&
      document.requestId === signatureRequest.id &&
      READABLE_DOCUMENT_STATUSES.has(document.status) &&
      !!document.unsignedPrivateFileId &&
      !!document.unsignedSha256 &&
      document.byteCount > 0 &&
      document.pageCount > 0
    )
  }
}
