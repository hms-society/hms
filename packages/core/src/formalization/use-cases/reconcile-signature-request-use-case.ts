import type { FileStorageProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureArtifact,
  FormalizationSignatureProtocol,
  FormalizationSignatureRequest,
  FormalizationSignatureProviderResource,
} from '../domain/entities'
import type {
  FormalizationSignatureProviderItemStatus,
  FormalizationSignatureRecipientChanges,
  FormalizationSignatureRecipientStatus,
  FormalizationSignatureReconciliationReason,
} from '../domain/structures'
import type {
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureGatewayTransaction,
  FormalizationSignatureProviderDocumentResourcesRepository,
  FormalizationSignatureProviderRecipientResourcesRepository,
  FormalizationSignatureRecipientDocumentsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureProviderResourcesRepository,
  FormalizationSignatureSnapshotsRepository,
  FormalizationsRepository,
  SignatureProvider,
} from '../interfaces'

type Request = {
  readonly requestId: string
  readonly reason: FormalizationSignatureReconciliationReason
  readonly occurredAt: Date
}
type Response = {
  readonly outcome:
    | 'unchanged'
    | 'submitted'
    | 'confirmed'
    | 'terminal'
    | 'retry_required'
}
type TerminalStatus = 'rejected' | 'cancelled' | 'expired'
type Dependencies = {
  readonly requestsRepository: FormalizationSignatureRequestsRepository
  readonly resourcesRepository: FormalizationSignatureProviderResourcesRepository
  readonly recipientResourcesRepository: FormalizationSignatureProviderRecipientResourcesRepository
  readonly documentResourcesRepository: FormalizationSignatureProviderDocumentResourcesRepository
  readonly documentsRepository: FormalizationSignatureRequestDocumentsRepository
  readonly recipientsRepository: FormalizationSignatureRecipientsRepository
  readonly assignmentsRepository: FormalizationSignatureRecipientDocumentsRepository
  readonly protocolsRepository: FormalizationSignatureProtocolsRepository
  readonly artifactsRepository: FormalizationSignatureArtifactsRepository
  readonly snapshotsRepository: FormalizationSignatureSnapshotsRepository
  readonly formalizationsRepository: FormalizationsRepository
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly fileStorageProvider: FileStorageProvider
  readonly idProvider: IdProvider
  readonly provider: SignatureProvider
}

const terminalStatuses = new Set<string>([
  'rejected',
  'cancelled',
  'expired',
  'confirmed',
  'failed',
])
const isTerminal = (status: string) => terminalStatuses.has(status)

export class ReconcileSignatureRequestUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const entity = await this.dependencies.requestsRepository.findById(request.requestId)
    if (!entity) return { outcome: 'retry_required' }
    const resource = await this.dependencies.resourcesRepository.findByRequestId(
      entity.id,
    )
    if (!resource || resource.requestId !== entity.id)
      return { outcome: 'retry_required' }
    const observation = await this.dependencies.provider.findEnvelopeState({
      providerEnvelopeId: resource.providerEnvelopeId,
    })
    if (observation.providerEnvelopeId !== resource.providerEnvelopeId)
      return { outcome: 'retry_required' }

    const [
      recipientResources,
      itemResources,
      assignments,
      documents,
      recipients,
      snapshot,
      formalization,
    ] = await Promise.all([
      this.dependencies.recipientResourcesRepository.listByProviderResourceId(
        resource.id,
      ),
      this.dependencies.documentResourcesRepository.listByProviderResourceId(resource.id),
      this.dependencies.assignmentsRepository.listByRequestId(entity.id),
      this.dependencies.documentsRepository.listByRequestId(entity.id),
      this.dependencies.recipientsRepository.listByRequestId(entity.id),
      this.dependencies.snapshotsRepository.findById(entity.snapshotId),
      this.dependencies.formalizationsRepository.findById(entity.formalizationId),
    ])
    if (
      !snapshot ||
      !formalization ||
      snapshot.formalizationId !== entity.formalizationId ||
      formalization.id !== entity.formalizationId ||
      (formalization.signatureRequestId !== undefined &&
        formalization.signatureRequestId !== entity.id) ||
      snapshot.signatureConfigurationVersion !== entity.signatureConfigurationVersion
    )
      return { outcome: 'retry_required' }
    if (
      !this.hasCompleteMapping(
        entity,
        resource,
        observation,
        recipientResources,
        itemResources,
        assignments,
        documents,
        recipients,
      )
    )
      return { outcome: 'retry_required' }

    if (entity.status === 'confirmed') return { outcome: 'confirmed' }
    if (isTerminal(entity.status)) return { outcome: 'terminal' }

    const envelopeTerminalStatus = terminalRecipientStatus(observation.envelopeStatus)
    const hasTerminalItem = observation.recipients.some((recipient) =>
      recipient.items.some(
        (item) => item.assignment === 'required' && isTerminal(item.status),
      ),
    )
    const allRequiredItemsComplete = assignments.every((assignment) => {
      const itemResource = itemResources.find(
        (item) => item.requestDocumentId === assignment.requestDocumentId,
      )
      const recipientResource = recipientResources.find(
        (recipient) => recipient.recipientId === assignment.recipientId,
      )
      const recipient = observation.recipients.find(
        (candidate) =>
          candidate.providerRecipientId === recipientResource?.providerRecipientId,
      )
      return (
        !!recipient &&
        !!itemResource &&
        recipient.items.some(
          (item) =>
            item.providerEnvelopeItemId === itemResource.providerEnvelopeItemId &&
            item.assignment === 'required' &&
            item.status === 'completed',
        )
      )
    })

    const recorded = await this.recordObservation(
      request,
      entity,
      observation,
      recipientResources,
      itemResources,
      assignments,
      documents,
      recipients,
      envelopeTerminalStatus,
    )
    if (!recorded) return { outcome: 'retry_required' }
    if (envelopeTerminalStatus || hasTerminalItem) return { outcome: 'terminal' }
    if (!allRequiredItemsComplete) return { outcome: 'unchanged' }
    if (observation.envelopeStatus !== 'completed') return { outcome: 'submitted' }

    const [freshRequest, freshDocuments, freshRecipients, freshFormalization] =
      await Promise.all([
        this.dependencies.requestsRepository.findById(entity.id),
        this.dependencies.documentsRepository.listByRequestId(entity.id),
        this.dependencies.recipientsRepository.listByRequestId(entity.id),
        this.dependencies.formalizationsRepository.findById(entity.formalizationId),
      ])
    if (!freshRequest || !freshFormalization) return { outcome: 'submitted' }
    if (
      isTerminal(freshRequest.status) ||
      freshRecipients.some((recipient) => isTerminal(recipient.status)) ||
      freshDocuments.some((document) => isTerminal(document.status)) ||
      freshFormalization.id !== entity.formalizationId ||
      (freshFormalization.signatureRequestId !== undefined &&
        freshFormalization.signatureRequestId !== entity.id)
    )
      return { outcome: 'terminal' }
    const sameRequestMembership =
      freshRecipients.length === recipients.length &&
      freshDocuments.length === documents.length &&
      freshRecipients.every(
        (recipient) =>
          recipient.requestId === entity.id &&
          recipients.some((current) => current.id === recipient.id),
      ) &&
      freshDocuments.every(
        (document) =>
          document.requestId === entity.id &&
          documents.some((current) => current.id === document.id),
      )
    if (
      !sameRequestMembership ||
      freshRequest.id !== entity.id ||
      freshRequest.formalizationId !== entity.formalizationId ||
      freshRequest.snapshotId !== entity.snapshotId ||
      freshRequest.signatureConfigurationVersion !==
        entity.signatureConfigurationVersion ||
      freshRequest.status !== 'submitted' ||
      freshRecipients.some((recipient) => recipient.status !== 'submitted') ||
      freshDocuments.some((document) => document.status !== 'submitted')
    )
      return { outcome: 'submitted' }
    return (await this.preserveArtifactsAndConfirm(
      request,
      freshRequest,
      resource,
      itemResources,
      freshDocuments,
      freshRecipients,
    ))
      ? { outcome: 'confirmed' }
      : { outcome: 'retry_required' }
  }

  private hasCompleteMapping(
    entity: FormalizationSignatureRequest,
    resource: FormalizationSignatureProviderResource,
    observation: Awaited<ReturnType<SignatureProvider['findEnvelopeState']>>,
    recipientResources: Awaited<
      ReturnType<
        FormalizationSignatureProviderRecipientResourcesRepository['listByProviderResourceId']
      >
    >,
    itemResources: Awaited<
      ReturnType<
        FormalizationSignatureProviderDocumentResourcesRepository['listByProviderResourceId']
      >
    >,
    assignments: Awaited<
      ReturnType<FormalizationSignatureRecipientDocumentsRepository['listByRequestId']>
    >,
    documents: Awaited<
      ReturnType<FormalizationSignatureRequestDocumentsRepository['listByRequestId']>
    >,
    recipients: Awaited<
      ReturnType<FormalizationSignatureRecipientsRepository['listByRequestId']>
    >,
  ): boolean {
    const expectedRecipients = new Set(
      recipientResources.map((item) => item.providerRecipientId),
    )
    if (
      recipientResources.length === 0 ||
      new Set(recipientResources.map((item) => item.recipientId)).size !==
        recipientResources.length ||
      expectedRecipients.size !== recipientResources.length ||
      recipientResources.some(
        (item) => item.requestId !== entity.id || item.providerResourceId !== resource.id,
      ) ||
      observation.recipients.length !== recipientResources.length ||
      new Set(observation.recipients.map((item) => item.providerRecipientId)).size !==
        observation.recipients.length ||
      observation.recipients.some(
        (item) => !expectedRecipients.has(item.providerRecipientId),
      )
    )
      return false
    if (
      itemResources.length === 0 ||
      itemResources.length !== documents.length ||
      new Set(itemResources.map((item) => item.requestDocumentId)).size !==
        itemResources.length ||
      new Set(itemResources.map((item) => item.providerEnvelopeItemId)).size !==
        itemResources.length ||
      itemResources.some(
        (item) => item.requestId !== entity.id || item.providerResourceId !== resource.id,
      ) ||
      documents.some(
        (document) =>
          document.requestId !== entity.id ||
          !itemResources.some((item) => item.requestDocumentId === document.id),
      )
    )
      return false
    if (
      assignments.length === 0 ||
      assignments.some(
        (assignment) =>
          assignment.requestId !== entity.id ||
          !recipients.some(
            (recipient) =>
              recipient.id === assignment.recipientId &&
              recipient.requestId === entity.id,
          ) ||
          !itemResources.some(
            (item) => item.requestDocumentId === assignment.requestDocumentId,
          ),
      ) ||
      new Set(
        assignments.map(
          (assignment) => `${assignment.recipientId}:${assignment.requestDocumentId}`,
        ),
      ).size !== assignments.length ||
      new Set(assignments.map((assignment) => assignment.requestDocumentId)).size !==
        documents.length ||
      new Set(assignments.map((assignment) => assignment.recipientId)).size !==
        recipients.length
    )
      return false
    const expectedPairs = assignments.map((assignment) => {
      const item = itemResources.find(
        (candidate) => candidate.requestDocumentId === assignment.requestDocumentId,
      )
      const recipient = recipientResources.find(
        (candidate) => candidate.recipientId === assignment.recipientId,
      )
      return `${recipient?.providerRecipientId}:${item?.providerEnvelopeItemId}`
    })
    if (new Set(expectedPairs).size !== expectedPairs.length) return false
    const expectedItemIds = new Set(
      itemResources.map((item) => item.providerEnvelopeItemId),
    )
    for (const recipient of observation.recipients) {
      const recipientResource = recipientResources.find(
        (candidate) => candidate.providerRecipientId === recipient.providerRecipientId,
      )
      if (!recipientResource) return false
      if (
        recipient.items.length !== itemResources.length ||
        new Set(recipient.items.map((item) => item.providerEnvelopeItemId)).size !==
          recipient.items.length ||
        new Set(recipient.items.map((item) => item.providerEnvelopeItemId)).size !==
          expectedItemIds.size ||
        recipient.items.some((item) => !expectedItemIds.has(item.providerEnvelopeItemId))
      )
        return false
      for (const item of recipient.items) {
        const itemResource = itemResources.find(
          (candidate) => candidate.providerEnvelopeItemId === item.providerEnvelopeItemId,
        )
        if (!itemResource) return false
        const assigned = assignments.some(
          (assignment) =>
            assignment.recipientId === recipientResource.recipientId &&
            assignment.requestDocumentId === itemResource.requestDocumentId,
        )
        if (item.assignment !== (assigned ? 'required' : 'not_required')) return false
      }
    }
    return expectedPairs.every((pair) => {
      const [providerRecipientId, providerItemId] = pair.split(':')
      const recipient = observation.recipients.find(
        (item) => item.providerRecipientId === providerRecipientId,
      )
      return (
        !!recipient &&
        recipient.items.some(
          (item) =>
            item.providerEnvelopeItemId === providerItemId &&
            item.assignment === 'required',
        )
      )
    })
  }

  private async recordObservation(
    request: Request,
    entity: FormalizationSignatureRequest,
    observation: Awaited<ReturnType<SignatureProvider['findEnvelopeState']>>,
    recipientResources: Awaited<
      ReturnType<
        FormalizationSignatureProviderRecipientResourcesRepository['listByProviderResourceId']
      >
    >,
    itemResources: Awaited<
      ReturnType<
        FormalizationSignatureProviderDocumentResourcesRepository['listByProviderResourceId']
      >
    >,
    assignments: Awaited<
      ReturnType<FormalizationSignatureRecipientDocumentsRepository['listByRequestId']>
    >,
    documents: Awaited<
      ReturnType<FormalizationSignatureRequestDocumentsRepository['listByRequestId']>
    >,
    recipients: Awaited<
      ReturnType<FormalizationSignatureRecipientsRepository['listByRequestId']>
    >,
    envelopeTerminalStatus: TerminalStatus | undefined,
  ): Promise<boolean> {
    const recipientObservations = observation.recipients
      .map((providerRecipient) => {
        const resourceRecipient = recipientResources.find(
          (item) => item.providerRecipientId === providerRecipient.providerRecipientId,
        )
        const recipient = resourceRecipient
          ? recipients.find((item) => item.id === resourceRecipient.recipientId)
          : undefined
        if (!resourceRecipient || !recipient) return null
        const assigned = assignments.filter(
          (assignment) => assignment.recipientId === recipient.id,
        )
        const submitted = assigned.every((assignment) => {
          const item = itemResources.find(
            (candidate) => candidate.requestDocumentId === assignment.requestDocumentId,
          )
          return (
            !!item &&
            providerRecipient.items.some(
              (candidate) =>
                candidate.providerEnvelopeItemId === item.providerEnvelopeItemId &&
                candidate.assignment === 'required' &&
                candidate.status === 'completed',
            )
          )
        })
        const derivedRecipientStatus: FormalizationSignatureRecipientStatus = submitted
          ? 'submitted'
          : providerRecipient.recipientStatus === 'submitted' ||
              providerRecipient.recipientStatus === 'confirmed'
            ? 'signing'
            : providerRecipient.recipientStatus
        const terminalStatus =
          terminalRecipientStatus(providerRecipient.recipientStatus) ??
          envelopeTerminalStatus
        const status =
          terminalStatus ??
          this.preserveRecipientProgress(recipient.status, derivedRecipientStatus)
        const changes: FormalizationSignatureRecipientChanges = {
          status,
          ...(status === 'submitted' ? { submittedAt: request.occurredAt } : {}),
          ...(terminalStatus ? { terminalAt: request.occurredAt } : {}),
        }
        return {
          recipientId: recipient.id,
          expectedRecipientVersion: recipient.version,
          recipientChanges: changes,
          recipientDocumentObservations: providerRecipient.items
            .map((item) => {
              const resourceItem = itemResources.find(
                (candidate) =>
                  candidate.providerEnvelopeItemId === item.providerEnvelopeItemId,
              )
              if (!resourceItem) return null
              return {
                requestDocumentId: resourceItem.requestDocumentId,
                providerEnvelopeItemId: item.providerEnvelopeItemId,
                assignment: item.assignment,
                status: item.status,
                requiredFieldCount: item.requiredFieldCount,
                completedFieldCount: item.completedFieldCount,
              }
            })
            .filter((item): item is NonNullable<typeof item> => item !== null),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
    const requestDocumentChanges = documents.map((document) => {
      const assigned = assignments.filter(
        (assignment) => assignment.requestDocumentId === document.id,
      )
      const item = itemResources.find(
        (candidate) => candidate.requestDocumentId === document.id,
      )
      const mappedStatuses = assigned.map((assignment) => {
        const resourceRecipient = recipientResources.find(
          (candidate) => candidate.recipientId === assignment.recipientId,
        )
        const providerRecipient = observation.recipients.find(
          (candidate) =>
            candidate.providerRecipientId === resourceRecipient?.providerRecipientId,
        )
        return providerRecipient?.items.find(
          (candidate) =>
            candidate.providerEnvelopeItemId === item?.providerEnvelopeItemId,
        )?.status
      })
      const status = deriveDocumentStatus(mappedStatuses, envelopeTerminalStatus)
      return {
        requestDocumentId: document.id,
        expectedVersion: document.version,
        changes:
          status === 'submitted'
            ? { status, submittedAt: request.occurredAt }
            : status === 'rejected' || status === 'cancelled' || status === 'expired'
              ? { status, terminalAt: request.occurredAt }
              : { status },
      }
    })
    const result = await this.dependencies.transaction.recordProviderObservationAndDerive(
      {
        observationScope: 'authoritative_envelope',
        envelopeStatus: observation.envelopeStatus,
        receiptUpdates: [],
        recipientObservations,
        requestDocumentChanges,
        requestId: entity.id,
        expectedRequestVersion: entity.version,
      },
    )
    return result !== 'conflict'
  }

  private preserveRecipientProgress(
    currentStatus: FormalizationSignatureRecipientStatus,
    observedStatus: FormalizationSignatureRecipientStatus,
  ): FormalizationSignatureRecipientStatus {
    if (currentStatus === 'locked' && observedStatus === 'invited') return currentStatus

    const progression: FormalizationSignatureRecipientStatus[] = [
      'invited',
      'authenticating',
      'authenticated',
      'reading',
      'signing',
      'submitted',
      'reconciliation_required',
      'confirmed',
    ]
    const currentIndex = progression.indexOf(currentStatus)
    const observedIndex = progression.indexOf(observedStatus)

    return currentIndex > observedIndex && observedIndex >= 0
      ? currentStatus
      : observedStatus
  }

  private async preserveArtifactsAndConfirm(
    request: Request,
    entity: FormalizationSignatureRequest,
    resource: FormalizationSignatureProviderResource,
    itemResources: Awaited<
      ReturnType<
        FormalizationSignatureProviderDocumentResourcesRepository['listByProviderResourceId']
      >
    >,
    documents: Awaited<
      ReturnType<FormalizationSignatureRequestDocumentsRepository['listByRequestId']>
    >,
    recipients: Awaited<
      ReturnType<FormalizationSignatureRecipientsRepository['listByRequestId']>
    >,
  ): Promise<boolean> {
    try {
      const artifacts = await this.dependencies.provider.downloadCompletedArtifacts({
        providerEnvelopeId: resource.providerEnvelopeId,
        documents: itemResources.map((item) => ({
          requestDocumentId: item.requestDocumentId,
          providerEnvelopeItemId: item.providerEnvelopeItemId,
        })),
      })
      const existing = await this.dependencies.artifactsRepository.findByRequestId(
        entity.id,
      )
      const documentIds = new Set(documents.map((document) => document.id))
      const incomingByKey = new Set<string>()
      for (const artifact of artifacts) {
        if (
          !['signed_pdf', 'provider_evidence', 'provider_certificate'].includes(
            artifact.kind,
          )
        )
          return false
        if (artifact.kind === 'signed_pdf') {
          if (!artifact.requestDocumentId || !documentIds.has(artifact.requestDocumentId))
            return false
          if (
            artifact.bytes.byteLength === 0 ||
            artifact.mediaType !== 'application/pdf' ||
            !isPdf(artifact.bytes)
          )
            return false
        } else if (artifact.requestDocumentId !== undefined) {
          return false
        }
        if (
          artifact.byteCount !== undefined &&
          artifact.byteCount !== artifact.bytes.byteLength
        )
          return false
        if (
          artifact.sha256 !== undefined &&
          artifact.sha256 !== (await sha256(artifact.bytes))
        )
          return false
        const key = `${artifact.kind}:${artifact.requestDocumentId ?? ''}`
        if (incomingByKey.has(key)) return false
        incomingByKey.add(key)
      }
      if (existing.some((artifact) => artifact.requestId !== entity.id)) return false
      const existingByKey = new Set<string>()
      for (const artifact of existing) {
        if (
          artifact.kind === 'signed_pdf' &&
          (!artifact.requestDocumentId || !documentIds.has(artifact.requestDocumentId))
        )
          return false
        if (artifact.kind !== 'signed_pdf' && artifact.requestDocumentId !== undefined)
          return false
        const key = `${artifact.kind}:${artifact.requestDocumentId ?? ''}`
        if (existingByKey.has(key)) return false
        existingByKey.add(key)
      }
      const signed = artifacts.filter((artifact) => artifact.kind === 'signed_pdf')
      const existingSignedIds = new Set(
        existing
          .filter((artifact) => artifact.kind === 'signed_pdf')
          .map((artifact) => artifact.requestDocumentId),
      )
      if (
        signed.length +
          existingSignedIds.size -
          signed.filter((artifact) => existingSignedIds.has(artifact.requestDocumentId))
            .length !==
        documents.length
      )
        return false
      const artifactsToAdd: FormalizationSignatureArtifact[] = []
      for (const artifact of artifacts) {
        if (
          existing.some(
            (item) =>
              item.kind === artifact.kind &&
              item.requestDocumentId === artifact.requestDocumentId,
          )
        )
          continue
        if (
          artifactsToAdd.some(
            (item) =>
              item.kind === artifact.kind &&
              item.requestDocumentId === artifact.requestDocumentId,
          )
        )
          continue
        const fileName = `${artifact.requestDocumentId ?? artifact.kind}.${artifact.kind === 'signed_pdf' ? 'pdf' : 'bin'}`
        const stored = await this.dependencies.fileStorageProvider.save({
          filePath: `formalization/signatures/${entity.id}/${fileName}`,
          fileName,
          contentType: artifact.mediaType,
          sizeInBytes: artifact.bytes.byteLength,
          content: artifact.bytes,
        })
        artifactsToAdd.push({
          id: this.dependencies.idProvider.generate(),
          requestId: entity.id,
          requestDocumentId: artifact.requestDocumentId,
          kind: artifact.kind,
          privateFileId: stored.id,
          sha256: await sha256(artifact.bytes),
          byteCount: artifact.bytes.byteLength,
          mediaType: artifact.mediaType,
          providerReference: artifact.providerReference,
          preservedAt: request.occurredAt,
        })
      }
      const allArtifacts = [...existing, ...artifactsToAdd].sort((left, right) =>
        `${left.kind}:${left.requestDocumentId ?? ''}:${left.sha256}:${left.byteCount}`.localeCompare(
          `${right.kind}:${right.requestDocumentId ?? ''}:${right.sha256}:${right.byteCount}`,
        ),
      )
      const artifactSetHash = await sha256(
        new TextEncoder().encode(
          allArtifacts
            .map(
              (artifact) =>
                `${artifact.kind}:${artifact.requestDocumentId ?? ''}:${artifact.sha256}:${artifact.byteCount}:${artifact.mediaType}:${artifact.providerReference ?? ''}`,
            )
            .join('|'),
        ),
      )
      const protocols: FormalizationSignatureProtocol[] = []
      for (const recipient of recipients) {
        const existingProtocol =
          await this.dependencies.protocolsRepository.findByRecipientAndRequest({
            recipientId: recipient.id,
            requestId: entity.id,
          })
        if (existingProtocol) {
          if (
            existingProtocol.requestId !== entity.id ||
            existingProtocol.recipientId !== recipient.id
          )
            return false
          continue
        }
        protocols.push({
          id: this.dependencies.idProvider.generate(),
          requestId: entity.id,
          recipientId: recipient.id,
          number: `HMS-${entity.id}-${recipient.id}`,
          artifactSetHash,
          confirmedAt: request.occurredAt,
        })
      }
      const result = await this.dependencies.transaction.confirmEnvelopeAndDerive({
        requestId: entity.id,
        expectedRequestVersion: entity.version,
        recipientChanges: recipients.map((recipient) => ({
          recipientId: recipient.id,
          expectedVersion: recipient.version,
          changes: { status: 'confirmed' as const, confirmedAt: request.occurredAt },
        })),
        protocols,
        artifactsToAdd,
        requestDocumentChanges: documents.map((document) => ({
          requestDocumentId: document.id,
          expectedVersion: document.version,
          changes: { status: 'confirmed' as const, confirmedAt: request.occurredAt },
        })),
      })
      return result === 'applied'
    } catch {
      return false
    }
  }
}

async function sha256(content: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    Uint8Array.from(content),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function isPdf(content: Uint8Array): boolean {
  return (
    content.byteLength >= 5 &&
    content[0] === 0x25 &&
    content[1] === 0x50 &&
    content[2] === 0x44 &&
    content[3] === 0x46 &&
    content[4] === 0x2d
  )
}

function terminalRecipientStatus(status: string): TerminalStatus | undefined {
  return status === 'rejected' || status === 'cancelled' || status === 'expired'
    ? status
    : undefined
}

function deriveDocumentStatus(
  statuses: ReadonlyArray<FormalizationSignatureProviderItemStatus | undefined>,
  envelopeTerminalStatus: TerminalStatus | undefined,
): 'sent' | 'submitted' | TerminalStatus {
  const observed = statuses.filter(
    (status): status is FormalizationSignatureProviderItemStatus => status !== undefined,
  )
  // A document is submitted only when every assigned recipient completed its
  // mapped item. A terminal item wins over an incomplete sibling observation,
  // while an envelope terminal state applies only to a non-completed document.
  const allObservedItemsCompleted =
    observed.length > 0 && observed.every((status) => status === 'completed')
  if (allObservedItemsCompleted) return 'submitted'
  const terminal = observed.find((status) => terminalRecipientStatus(status))
  if (terminal) return terminal as TerminalStatus
  if (
    envelopeTerminalStatus === 'rejected' ||
    envelopeTerminalStatus === 'cancelled' ||
    envelopeTerminalStatus === 'expired'
  )
    return envelopeTerminalStatus
  return 'sent'
}
