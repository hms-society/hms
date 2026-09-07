import { CollaboratorProfile } from '../../identity/domain/structures'
import type { Broker, DatetimeProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureRequest,
  FormalizationSignatureRequestDocument,
  FormalizationSignatureRecipient,
  FormalizationSignatureRecipientDocument,
  FormalizationSignatureProvisioningAttempt,
  FormalizationSignatureSnapshot,
} from '../domain/entities'
import {
  FormalizationNotFoundError,
  FormalizationSignatureNotReadyError,
  FormalizationSignatureRequestConflictError,
  FormalizationSignatureStaleConfigurationError,
} from '../domain/errors'
import { FormalizationSignatureRequestProvisioningRequestedEvent } from '../domain/events/formalization-signature-request-provisioning-requested-event'
import type { FormalizationActor, FormalizationSignatureConfiguration } from '../domain/structures'
import { FormalizationSignatureRequestStatus, FormalizationSignatureStatus } from '../domain/structures'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureDocumentMetadataReader,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
  SignatureSecretHasher,
} from '../interfaces'

type Request = {
  readonly formalizationId: string
  readonly actorId: string
  readonly actorProfile?: FormalizationActor['actorProfile']
  readonly expectedVersion: number
  readonly confirmationKey: string
}

type Response = {
  readonly requestId: string
  readonly status: FormalizationSignatureRequestStatus
  readonly duplicate: boolean
}

type Dependencies = {
  readonly formalizationsRepository: FormalizationsRepository
  readonly configurationRepository: FormalizationSignatureConfigurationRepository
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly idProvider: IdProvider
  readonly datetimeProvider: DatetimeProvider
  readonly broker: Broker
  readonly hasher: SignatureSecretHasher
  readonly metadataReader: FormalizationSignatureDocumentMetadataReader
}

export class ConfirmFormalizationSignatureSendingUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const formalization = await this.dependencies.formalizationsRepository.findById(
      request.formalizationId,
    )
    if (!formalization) throw new FormalizationNotFoundError()

    const confirmationKeyHash = this.dependencies.hasher.hash(request.confirmationKey)
    const existing = await this.dependencies.requestsRepository.findByConfirmationKeyHash(
      confirmationKeyHash,
    )
    if (existing) return { requestId: existing.id, status: existing.status, duplicate: true }

    if (
      formalization.assignedLawyerId !== request.actorId &&
      request.actorProfile !== CollaboratorProfile.Admin
    ) {
      throw new FormalizationSignatureRequestConflictError()
    }
    if (formalization.version !== request.expectedVersion) {
      throw new FormalizationSignatureRequestConflictError()
    }

    const configuration = await this.dependencies.configurationRepository.findByFormalizationId(
      formalization.id,
    )
    this.assertReady(configuration)

    const sourceDocuments = await this.dependencies.sourceReader.listCurrentDocuments(
      formalization.id,
    )
    if (
      sourceDocuments.length !== configuration.documents.length ||
      configuration.documents.some(
        (document) =>
          !sourceDocuments.some(
            (source) =>
              source.documentId === document.documentId &&
              source.documentVersionId === document.documentVersionId,
          ),
      )
    ) {
      throw new FormalizationSignatureStaleConfigurationError()
    }

    const metadata = await Promise.all(
      configuration.documents.map((document) =>
        this.dependencies.metadataReader.findMetadata({
          formalizationId: formalization.id,
          previewId: document.preview?.previewId ?? '',
        }),
      ),
    )
    if (
      metadata.some(
        (item) => !item || !item.privateFileId || !item.sha256 || item.byteCount <= 0,
      )
    ) {
      throw new FormalizationSignatureStaleConfigurationError()
    }

    const now = this.dependencies.datetimeProvider.now()
    const snapshot: FormalizationSignatureSnapshot = {
      id: this.dependencies.idProvider.generate(),
      formalizationId: formalization.id,
      formalizationVersion: formalization.version,
      signatureConfigurationVersion: configuration.version,
      snapshotHash: this.dependencies.hasher.hash(
        `${formalization.id}:${configuration.version}`,
      ),
      createdBy: request.actorId,
      createdAt: now,
    }
    const signatureRequest: FormalizationSignatureRequest = {
      id: this.dependencies.idProvider.generate(),
      formalizationId: formalization.id,
      signatureConfigurationVersion: configuration.version,
      snapshotId: snapshot.id,
      confirmationKeyHash,
      status: FormalizationSignatureRequestStatus.provisioning,
      version: 1,
      createdBy: request.actorId,
      createdAt: now,
      updatedAt: now,
    }
    const documents = this.createDocuments(configuration, signatureRequest.id, metadata, now)
    const recipients: FormalizationSignatureRecipient[] = configuration.signatories.map(
      (signatory) => ({
        id: this.dependencies.idProvider.generate(),
        requestId: signatureRequest.id,
        signatoryId: signatory.signatoryId,
        personId: signatory.personId,
        actorKind: signatory.role === 'client' ? 'client' : 'collaborator',
        displayNameSnapshot: signatory.name,
        deliveryChannel: 'email',
        status: 'invited',
        version: 1,
        createdAt: now,
        updatedAt: now,
      }),
    )
    const recipientDocuments: FormalizationSignatureRecipientDocument[] = []
    for (const [index, signatory] of configuration.signatories.entries()) {
      const recipient = recipients[index]
      for (const sourceDocumentId of signatory.documentIds) {
        const document = documents.find((item) => item.sourceDocumentId === sourceDocumentId)
        if (!document) throw new FormalizationSignatureStaleConfigurationError()
        recipientDocuments.push({
          id: this.dependencies.idProvider.generate(),
          requestId: signatureRequest.id,
          recipientId: recipient.id,
          requestDocumentId: document.id,
          createdAt: now,
        })
      }
    }
    const provisioningAttempt: FormalizationSignatureProvisioningAttempt = {
      id: this.dependencies.idProvider.generate(),
      requestId: signatureRequest.id,
      attemptToken: this.dependencies.idProvider.generate(),
      status: 'pending',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    }
    const transactionResult = await this.dependencies.transaction.confirmSending({
      formalizationId: formalization.id,
      expectedFormalizationVersion: request.expectedVersion,
      expectedSignatureConfigurationVersion: configuration.version,
      snapshot,
      request: signatureRequest,
      documents,
      recipients,
      recipientDocuments,
      provisioningAttempt,
      formalizationChanges: {
        signatureRequestId: signatureRequest.id,
        signatureStatus: FormalizationSignatureRequestStatus.provisioning,
      },
    })
    if (transactionResult === 'conflict') {
      throw new FormalizationSignatureRequestConflictError()
    }
    if (transactionResult === 'applied') {
      await this.dependencies.broker.publish(
        new FormalizationSignatureRequestProvisioningRequestedEvent({
          requestId: signatureRequest.id,
          provisioningAttemptId: provisioningAttempt.id,
          occurredAt: now,
          correlationId: signatureRequest.id,
        }),
      )
    }
    return {
      requestId: signatureRequest.id,
      status: signatureRequest.status,
      duplicate: transactionResult === 'duplicate',
    }
  }

  private assertReady(configuration: FormalizationSignatureConfiguration | null): asserts configuration is FormalizationSignatureConfiguration {
    if (
      !configuration ||
      configuration.status !== FormalizationSignatureStatus.ReadyForSending ||
      !configuration.readiness.ready ||
      !configuration.editable
    ) {
      throw new FormalizationSignatureNotReadyError()
    }
  }

  private createDocuments(
    configuration: FormalizationSignatureConfiguration,
    requestId: string,
    metadata: ReadonlyArray<{ privateFileId: string; sha256: string; byteCount: number } | null>,
    now: Date,
  ): FormalizationSignatureRequestDocument[] {
    return configuration.documents.map((document, index) => {
      const item = metadata[index]
      if (
        !item ||
        !document.preview?.previewId ||
        !document.preview.pageCount ||
        document.preview.pageCount <= 0
      ) {
        throw new FormalizationSignatureStaleConfigurationError()
      }
      return {
        id: this.dependencies.idProvider.generate(),
        requestId,
        sourceDocumentId: document.documentId,
        sourceDocumentVersionId: document.documentVersionId,
        signaturePreviewId: document.preview.previewId,
        unsignedPrivateFileId: item.privateFileId,
        unsignedSha256: item.sha256,
        byteCount: item.byteCount,
        pageCount: document.preview.pageCount,
        position: index,
        status: 'pending',
        version: 1,
        createdAt: now,
        updatedAt: now,
      }
    })
  }
}
