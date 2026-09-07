import type { DatetimeProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type { FormalizationSignatureProxyBinding } from '../domain/entities'
import type {
  FormalizationSignatureGatewaySessionsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureDocumentAcknowledgementsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureProxyBindingsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureSourceReader,
  SignatureProvider,
  SignatureSecretHasher,
} from '../interfaces'
import {
  SignatureCsrfInvalidError,
  SignatureDeviceMismatchError,
  SignatureReconciliationRequiredError,
  SignatureSessionInvalidError,
  SignatureProxyContractViolationError,
  SignatureProviderUnavailableError,
} from '../domain/errors'

const SIGNABLE_REQUEST_STATUSES = new Set(['in_progress', 'partially_submitted'])

type Request = {
  readonly sessionToken: string
  readonly deviceToken: string
  readonly csrfToken: string
  readonly expectedRequestVersion: number
  readonly actorId?: string
}
type Response = { readonly proxyPath: string; readonly expiresAt: Date }
type SecretGenerator = { generate(): string }
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository
  readonly acknowledgementsRepository: FormalizationSignatureDocumentAcknowledgementsRepository
  readonly providerResourcesRepository: FormalizationSignatureProviderResourcesRepository
  readonly providerRecipientResourcesRepository: FormalizationSignatureProviderRecipientResourcesRepository
  readonly bindingsRepository: FormalizationSignatureProxyBindingsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly provider: SignatureProvider
  readonly sourceReader: FormalizationSignatureSourceReader
  readonly datetimeProvider: DatetimeProvider
  readonly idProvider: IdProvider
  readonly secretGenerator: SecretGenerator
  readonly hasher: SignatureSecretHasher
}

export class StartFormalizationSigningUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}
  async execute(request: Request): Promise<Response> {
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hasher.hash(request.sessionToken),
    )
    if (session?.kind !== 'authenticated' || session.status !== 'active')
      throw new SignatureSessionInvalidError()
    const now = this.dependencies.datetimeProvider.now()
    if (!Number.isFinite(session.expiresAt?.getTime()) || session.expiresAt <= now)
      throw new SignatureSessionInvalidError()
    if (session.deviceSecretHash !== this.dependencies.hasher.hash(request.deviceToken))
      throw new SignatureDeviceMismatchError()
    if (session.csrfHash !== this.dependencies.hasher.hash(request.csrfToken))
      throw new SignatureCsrfInvalidError()
    const signatureRequest = await this.dependencies.requestsRepository.findById(
      session.requestId,
    )
    if (
      !signatureRequest ||
      signatureRequest.version !== request.expectedRequestVersion ||
      signatureRequest.snapshotId !== session.snapshotId ||
      !SIGNABLE_REQUEST_STATUSES.has(signatureRequest.status) ||
      ['confirmed', 'rejected', 'cancelled', 'expired', 'failed'].includes(
        signatureRequest.status,
      )
    )
      throw new SignatureSessionInvalidError()
    const signatureRecipient = await this.dependencies.recipientsRepository.findById(
      session.recipientId,
    )
    if (
      !signatureRecipient ||
      signatureRecipient.requestId !== signatureRequest.id ||
      signatureRecipient.id !== session.recipientId ||
      !['reading', 'signing'].includes(signatureRecipient.status)
    )
      throw new SignatureSessionInvalidError()
    const recipient = await this.dependencies.sourceReader.findAuthenticationSource(
      signatureRecipient.personId,
    )
    if (
      !recipient ||
      recipient.personId !== signatureRecipient.personId ||
      !recipient.active ||
      recipient.actorKind !== signatureRecipient.actorKind ||
      (recipient.actorKind === 'collaborator' &&
        !['lawyer', 'paralegal', 'supervisor'].includes(recipient.collaboratorRole ?? ''))
    )
      throw new SignatureSessionInvalidError()
    if (
      recipient.actorKind === 'collaborator' &&
      request.actorId !== signatureRecipient.personId
    )
      throw new SignatureSessionInvalidError()
    const documents = await this.dependencies.documentsRepository.listByRequestId(
      signatureRequest.id,
    )
    if (
      documents.length === 0 ||
      new Set(documents.map((document) => document.id)).size !== documents.length ||
      documents.some((document) => document.requestId !== signatureRequest.id)
    )
      throw new SignatureReconciliationRequiredError()
    const assignments = await this.dependencies.assignmentsRepository.listByRecipientId(
      session.recipientId,
    )
    const requestAssignments = assignments.filter(
      (assignment) => assignment.requestId === signatureRequest.id,
    )
    if (
      requestAssignments.length === 0 ||
      requestAssignments.some(
        (assignment) =>
          assignment.recipientId !== signatureRecipient.id ||
          !assignment.requestDocumentId ||
          !documents.some((document) => document.id === assignment.requestDocumentId),
      ) ||
      new Set(
        requestAssignments.map(
          (assignment) => `${assignment.recipientId}:${assignment.requestDocumentId}`,
        ),
      ).size !== requestAssignments.length
    )
      throw new SignatureReconciliationRequiredError()
    const acknowledgements =
      await this.dependencies.acknowledgementsRepository.listByRecipientAndSnapshot({
        recipientId: session.recipientId,
        snapshotId: session.snapshotId,
      })
    if (
      acknowledgements.some(
        (acknowledgement) =>
          acknowledgement.requestId !== signatureRequest.id ||
          acknowledgement.snapshotId !== session.snapshotId ||
          acknowledgement.recipientId !== session.recipientId ||
          !documents.some(
            (document) => document.id === acknowledgement.requestDocumentId,
          ),
      ) ||
      documents.some(
        (document) =>
          !acknowledgements.some(
            (acknowledgement) =>
              acknowledgement.requestDocumentId === document.id &&
              acknowledgement.requestId === signatureRequest.id,
          ),
      )
    )
      throw new SignatureReconciliationRequiredError()
    if (
      new Set(acknowledgements.map((acknowledgement) => acknowledgement.id)).size !==
        acknowledgements.length ||
      new Set(
        acknowledgements.map((acknowledgement) => acknowledgement.requestDocumentId),
      ).size !== acknowledgements.length
    )
      throw new SignatureReconciliationRequiredError()
    const resource = await this.dependencies.providerResourcesRepository.findByRequestId(
      session.requestId,
    )
    const recipientResource =
      await this.dependencies.providerRecipientResourcesRepository.findByRecipientId(
        session.recipientId,
      )
    if (
      !resource ||
      resource.requestId !== signatureRequest.id ||
      resource.providerContractVersion !==
        this.dependencies.provider.getContractVersion() ||
      !recipientResource ||
      recipientResource.requestId !== signatureRequest.id ||
      recipientResource.recipientId !== signatureRecipient.id ||
      recipientResource.providerResourceId !== resource.id
    )
      throw new SignatureReconciliationRequiredError()

    const activeBindings =
      await this.dependencies.bindingsRepository.findActiveByRecipientId(
        session.recipientId,
      )
    const alias = this.dependencies.secretGenerator.generate()
    const aliasHash = this.dependencies.hasher.hash(alias)
    let expiresAt: Date
    let operation:
      | { readonly kind: 'create'; readonly binding: FormalizationSignatureProxyBinding }
      | {
          readonly kind: 'rotate'
          readonly bindingId: string
          readonly expectedAliasHash: string
          readonly replacementAliasHash: string
          readonly replacementExpiresAt: Date
        }

    if (signatureRecipient.status === 'reading') {
      if (activeBindings.length !== 0) throw new SignatureProxyContractViolationError()
      let providerBinding: Awaited<ReturnType<SignatureProvider['createSigningBinding']>>
      try {
        providerBinding = await this.dependencies.provider.createSigningBinding({
          providerEnvelopeId: resource.providerEnvelopeId,
          providerRecipientId: recipientResource.providerRecipientId,
          recipientId: signatureRecipient.id,
        })
      } catch {
        throw new SignatureProviderUnavailableError()
      }
      if (
        !providerBinding.encryptedCredential ||
        !providerBinding.cipherKeyId ||
        !Number.isFinite(providerBinding.expiresAt?.getTime()) ||
        providerBinding.expiresAt <= now
      )
        throw new SignatureProxyContractViolationError()
      expiresAt = providerBinding.expiresAt
      operation = {
        kind: 'create',
        binding: {
          id: this.dependencies.idProvider.generate(),
          sessionId: session.id,
          requestId: session.requestId,
          recipientId: session.recipientId,
          aliasHash,
          encryptedProviderCredential: providerBinding.encryptedCredential,
          cipherKeyId: providerBinding.cipherKeyId,
          providerContractVersion: this.dependencies.provider.getContractVersion(),
          status: 'active',
          expiresAt,
        },
      }
    } else {
      if (activeBindings.length !== 1) throw new SignatureProxyContractViolationError()
      const binding = activeBindings[0]
      if (
        !binding ||
        binding.status !== 'active' ||
        binding.sessionId !== session.id ||
        binding.requestId !== signatureRequest.id ||
        binding.recipientId !== signatureRecipient.id ||
        !binding.aliasHash ||
        !binding.encryptedProviderCredential ||
        !binding.cipherKeyId ||
        binding.providerContractVersion !==
          this.dependencies.provider.getContractVersion() ||
        !Number.isFinite(binding.expiresAt?.getTime()) ||
        binding.expiresAt <= now
      )
        throw new SignatureProxyContractViolationError()
      expiresAt = binding.expiresAt
      operation = {
        kind: 'rotate',
        bindingId: binding.id,
        expectedAliasHash: binding.aliasHash,
        replacementAliasHash: aliasHash,
        replacementExpiresAt: expiresAt,
      }
    }

    const outcome = await this.dependencies.transaction.startProviderEntry({
      sessionId: session.id,
      expectedSessionVersion: session.version,
      requestId: signatureRequest.id,
      expectedRequestVersion: signatureRequest.version,
      recipientId: signatureRecipient.id,
      expectedRecipientVersion: signatureRecipient.version,
      operation,
      recipientChanges: { status: 'signing' },
    })
    const expectedOutcome = operation.kind === 'create' ? 'created' : 'rotated'
    if (outcome !== expectedOutcome) throw new SignatureProxyContractViolationError()
    return {
      proxyPath: `/assinaturas/provedor/${alias}/sign/${alias}`,
      expiresAt,
    }
  }
}
