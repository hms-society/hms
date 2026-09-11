import type { UseCase } from '../../shared/interfaces'
import { CollaboratorProfile } from '../../identity/domain/structures'
import type {
  FormalizationSignatureInvitation,
  FormalizationSignatureRecipient,
} from '../domain/entities'
import {
  FormalizationNotFoundError,
  FormalizationSignatureSendingForbiddenError,
} from '../domain/errors'
import {
  FormalizationSignatureRequestDocumentStatus,
  FormalizationSignatureRecipientStatus,
  FormalizationSignatureRequestStatus,
} from '../domain/structures'
import type {
  FormalizationSignatureSendingStatusResponse,
  FormalizationSignatureTrackingDocument,
  FormalizationSignatureTrackingSignatory,
} from '../domain/structures'
import type { FormalizationActor } from '../domain/structures/formalization-actor'
import type {
  FormalizationsRepository,
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureInvitationsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
} from '../interfaces'

type Request = FormalizationActor & { readonly formalizationId: string }
type Response = FormalizationSignatureSendingStatusResponse
type Dependencies = {
  readonly formalizationsRepository: FormalizationsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly configurationRepository?: FormalizationSignatureConfigurationRepository
  readonly recipientsRepository?: FormalizationSignatureRecipientsRepository
  readonly recipientDocumentsRepository?: FormalizationSignatureRecipientDocumentsRepository
  readonly invitationsRepository?: FormalizationSignatureInvitationsRepository
  readonly artifactsRepository?: FormalizationSignatureArtifactsRepository
  readonly protocolsRepository?: FormalizationSignatureProtocolsRepository
  readonly sourceReader?: FormalizationSignatureSourceReader
}

const terminalStatuses = new Set<FormalizationSignatureRequestStatus>([
  FormalizationSignatureRequestStatus.confirmed,
  FormalizationSignatureRequestStatus.rejected,
  FormalizationSignatureRequestStatus.cancelled,
  FormalizationSignatureRequestStatus.expired,
])
const retryableRequestStatuses = new Set<FormalizationSignatureRequestStatus>([
  FormalizationSignatureRequestStatus.reconciliationRequired,
  FormalizationSignatureRequestStatus.failed,
])
const retryableDocumentStatuses = new Set([
  FormalizationSignatureRequestDocumentStatus.reconciliationRequired,
  FormalizationSignatureRequestDocumentStatus.failed,
]) as Set<FormalizationSignatureRequestDocumentStatus>
const resendableRecipientStatuses = new Set<FormalizationSignatureRecipientStatus>([
  FormalizationSignatureRecipientStatus.invited,
  FormalizationSignatureRecipientStatus.authenticating,
  FormalizationSignatureRecipientStatus.locked,
  FormalizationSignatureRecipientStatus.authenticated,
  FormalizationSignatureRecipientStatus.reading,
  FormalizationSignatureRecipientStatus.reconciliationRequired,
])

export class GetFormalizationSignatureSendingStatusUseCase
  implements UseCase<Request, Response | null>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response | null> {
    const formalization = await this.dependencies.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()

    const signatureRequest =
      await this.dependencies.requestsRepository.findLatestByFormalizationId(
        formalization.id,
      )
    const operator =
      formalization.assignedLawyerId === request.actorId ||
      request.actorProfile === CollaboratorProfile.Admin
    if (!signatureRequest) {
      if (!operator) throw new FormalizationSignatureSendingForbiddenError()
      return null
    }
    const recipients = this.dependencies.recipientsRepository
      ? await this.dependencies.recipientsRepository.listByRequestId(signatureRequest.id)
      : []
    const linkedRecipient = recipients.find(
      (recipient) =>
        recipient.personId === request.actorId && recipient.actorKind === 'collaborator',
    )
    const linkedPerson =
      linkedRecipient && this.dependencies.sourceReader
        ? await this.dependencies.sourceReader.findPerson(linkedRecipient.personId)
        : undefined
    const canTrackAsLinkedRecipient = Boolean(
      linkedRecipient &&
        linkedPerson &&
        (linkedPerson.profile === CollaboratorProfile.Lawyer ||
          linkedPerson.profile === CollaboratorProfile.Paralegal ||
          linkedPerson.profile === CollaboratorProfile.Supervisor),
    )
    if (!operator && !canTrackAsLinkedRecipient) {
      throw new FormalizationSignatureSendingForbiddenError()
    }

    const viewerMode = operator ? 'operator' : 'tracking_only'
    const documents = await this.dependencies.documentsRepository.listByRequestId(
      signatureRequest.id,
    )
    const assignments = this.dependencies.recipientDocumentsRepository
      ? await this.dependencies.recipientDocumentsRepository.listByRequestId(
          signatureRequest.id,
        )
      : []
    const artifacts = this.dependencies.artifactsRepository
      ? await this.dependencies.artifactsRepository.findByRequestId(signatureRequest.id)
      : []
    const protocolByRecipientId = new Map<string, string>()
    if (this.dependencies.protocolsRepository) {
      await Promise.all(
        recipients.map(async (recipient) => {
          const protocol =
            await this.dependencies.protocolsRepository?.findByRecipientAndRequest({
              recipientId: recipient.id,
              requestId: signatureRequest.id,
            })
          if (protocol) protocolByRecipientId.set(recipient.id, protocol.number)
        }),
      )
    }

    const invitations = await this.loadInvitations(recipients)
    const trackingDocuments = await Promise.all(
      documents
        .slice()
        .sort((left, right) => left.position - right.position)
        .map((document) =>
          this.toTrackingDocument({
            document,
            recipients,
            assignments,
            invitations,
            artifacts,
            protocolByRecipientId,
            formalizationId: formalization.id,
            viewerMode,
          }),
        ),
    )
    const completedDocuments = documents.filter(
      (document) =>
        document.status === FormalizationSignatureRequestDocumentStatus.submitted ||
        document.status === FormalizationSignatureRequestDocumentStatus.confirmed,
    ).length
    const failedDocuments = documents.filter((document) =>
      retryableDocumentStatuses.has(document.status),
    ).length
    const allRecipientsConfirmed =
      recipients.length > 0 &&
      recipients.every((recipient) => recipient.status === 'confirmed')
    const allDocumentsReady =
      documents.length > 0 &&
      documents.every(
        (document) =>
          document.status === FormalizationSignatureRequestDocumentStatus.confirmed &&
          artifacts.some(
            (artifact) =>
              artifact.requestDocumentId === document.id &&
              artifact.kind === 'signed_pdf',
          ),
      )
    const allProtocolsPresent =
      recipients.length > 0 &&
      recipients.every((recipient) => protocolByRecipientId.has(recipient.id))

    return {
      formalizationId: formalization.id,
      formalizationStatus: formalization.status,
      formalizationVersion: formalization.version,
      ...(formalization.completedAt ? { completedAt: formalization.completedAt } : {}),
      requestId: signatureRequest.id,
      status: signatureRequest.status,
      version: signatureRequest.version,
      ...(signatureRequest.sentAt ? { sentAt: signatureRequest.sentAt } : {}),
      ...(signatureRequest.submittedAt
        ? { submittedAt: signatureRequest.submittedAt }
        : {}),
      ...(signatureRequest.confirmedAt
        ? { confirmedAt: signatureRequest.confirmedAt }
        : {}),
      ...(signatureRequest.terminalAt ? { terminalAt: signatureRequest.terminalAt } : {}),
      ...(signatureRequest.cancellationRequestedAt
        ? { cancellationRequestedAt: signatureRequest.cancellationRequestedAt }
        : {}),
      totalDocuments: documents.length,
      completedDocuments,
      failedDocuments,
      progressPercentage:
        documents.length === 0
          ? 0
          : Math.round((completedDocuments / documents.length) * 100),
      canCancel:
        operator &&
        !terminalStatuses.has(signatureRequest.status) &&
        !signatureRequest.cancellationRequestedAt,
      canRetry:
        operator &&
        (retryableRequestStatuses.has(signatureRequest.status) || failedDocuments > 0),
      canConfirmContracting:
        operator &&
        formalization.status === 'in_progress' &&
        signatureRequest.status === FormalizationSignatureRequestStatus.confirmed &&
        allDocumentsReady &&
        allRecipientsConfirmed &&
        allProtocolsPresent,
      viewerMode,
      permissions: {
        canOperate: operator,
        canViewDocumentContent: false,
      },
      documents: trackingDocuments,
    }
  }

  private async loadInvitations(
    recipients: readonly FormalizationSignatureRecipient[],
  ): Promise<Map<string, FormalizationSignatureInvitation>> {
    const invitations = new Map<string, FormalizationSignatureInvitation>()
    if (!this.dependencies.invitationsRepository) return invitations
    await Promise.all(
      recipients.map(async (recipient) => {
        const invitation =
          await this.dependencies.invitationsRepository?.findLatestByRecipientId(
            recipient.id,
          )
        if (invitation) invitations.set(recipient.id, invitation)
      }),
    )
    return invitations
  }

  private async toTrackingDocument(input: {
    readonly document: Awaited<
      ReturnType<FormalizationSignatureRequestDocumentsRepository['listByRequestId']>
    >[number]
    readonly recipients: readonly FormalizationSignatureRecipient[]
    readonly assignments: readonly { recipientId: string; requestDocumentId: string }[]
    readonly invitations: ReadonlyMap<string, FormalizationSignatureInvitation>
    readonly artifacts: Awaited<
      ReturnType<FormalizationSignatureArtifactsRepository['findByRequestId']>
    >
    readonly protocolByRecipientId: ReadonlyMap<string, string>
    readonly formalizationId: string
    readonly viewerMode: 'operator' | 'tracking_only'
  }): Promise<FormalizationSignatureTrackingDocument> {
    const title = await this.dependencies.sourceReader?.findDocumentVersion(
      input.formalizationId,
      input.document.sourceDocumentVersionId,
    )
    const documentRecipients = input.recipients.filter((recipient) =>
      input.assignments.some(
        (assignment) =>
          assignment.recipientId === recipient.id &&
          assignment.requestDocumentId === input.document.id,
      ),
    )
    return {
      requestDocumentId: input.document.id,
      sourceDocumentId: input.document.sourceDocumentId,
      title: title?.name ?? input.document.sourceDocumentId,
      position: input.document.position,
      status: input.document.status,
      ...(input.document.submittedAt ? { submittedAt: input.document.submittedAt } : {}),
      ...(input.document.confirmedAt ? { confirmedAt: input.document.confirmedAt } : {}),
      ...(input.document.terminalAt ? { terminalAt: input.document.terminalAt } : {}),
      signedArtifactAvailable: input.artifacts.some(
        (artifact) =>
          artifact.requestDocumentId === input.document.id &&
          artifact.kind === 'signed_pdf',
      ),
      signatories: documentRecipients.map((recipient) =>
        this.toTrackingSignatory(
          recipient,
          input.invitations.get(recipient.id),
          input.protocolByRecipientId.get(recipient.id),
          input.viewerMode,
        ),
      ),
    }
  }

  private toTrackingSignatory(
    recipient: FormalizationSignatureRecipient,
    invitation: FormalizationSignatureInvitation | undefined,
    protocolNumber: string | undefined,
    viewerMode: 'operator' | 'tracking_only',
  ): FormalizationSignatureTrackingSignatory {
    return {
      recipientId: recipient.id,
      recipientVersion: recipient.version,
      displayName: recipient.displayNameSnapshot,
      actorKind: recipient.actorKind,
      deliveryChannel: recipient.deliveryChannel,
      status: recipient.status,
      ...(invitation
        ? {
            invitationGeneration: invitation.generation,
            invitationStatus: invitation.status,
            invitationDeliveryStatus: invitation.deliveryStatus,
            invitedAt: invitation.createdAt,
          }
        : {}),
      ...(recipient.submittedAt ? { submittedAt: recipient.submittedAt } : {}),
      ...(recipient.confirmedAt ? { confirmedAt: recipient.confirmedAt } : {}),
      ...(recipient.terminalAt ? { terminalAt: recipient.terminalAt } : {}),
      ...(protocolNumber ? { protocolNumber } : {}),
      canResend:
        viewerMode === 'operator' && resendableRecipientStatuses.has(recipient.status),
    }
  }
}
