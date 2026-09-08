import type { Broker, IdProvider, UseCase } from '../../shared/interfaces'
import type {
  FormalizationSignatureGatewayTransaction,
  SensitivePayloadCipherProvider,
} from '../interfaces'
import { FormalizationSignatureReconciliationRequestedEvent } from '../domain/events'

type Request = {
  readonly receiptId: string
  readonly occurredAt: Date
}
type Response = {
  readonly outcome:
    | 'processed'
    | 'reconciliation_requested'
    | 'already_processed'
    | 'retry_required'
}
type ObservationHint = {
  readonly kind: 'observation'
  readonly requestId: string
  readonly expectedRequestVersion: number
  readonly envelopeStatus:
    | 'draft'
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'rejected'
    | 'cancelled'
    | 'expired'
  readonly recipient: {
    readonly recipientId: string
    readonly expectedRecipientVersion: number
    readonly recipientStatus:
      | 'invited'
      | 'authenticating'
      | 'locked'
      | 'authenticated'
      | 'reading'
      | 'signing'
      | 'submitted'
      | 'reconciliation_required'
      | 'confirmed'
      | 'rejected'
      | 'cancelled'
      | 'expired'
    readonly items: ReadonlyArray<{
      readonly requestDocumentId: string
      readonly expectedVersion: number
      readonly providerEnvelopeItemId: string
      readonly assignment: 'required' | 'not_required'
      readonly status: 'pending' | 'completed' | 'rejected' | 'cancelled' | 'expired'
      readonly requiredFieldCount: number
      readonly completedFieldCount: number
    }>
  }
}
type ReconciliationOnlyHint = {
  readonly kind: 'reconciliation_only'
  readonly requestId: string
}
type NeutralHint = ObservationHint | ReconciliationOnlyHint
type Dependencies = {
  readonly transaction: FormalizationSignatureGatewayTransaction
  readonly cipher: SensitivePayloadCipherProvider
  readonly idProvider: IdProvider
  readonly broker: Broker
}

const CLAIM_LEASE_MS = 30_000
const TERMINAL_ENVELOPE_STATUSES = new Set([
  'completed',
  'rejected',
  'cancelled',
  'expired',
])
const TERMINAL_RECIPIENT_STATUSES = new Set([
  'confirmed',
  'rejected',
  'cancelled',
  'expired',
])
const TERMINAL_ITEM_STATUSES = new Set(['completed', 'rejected', 'cancelled', 'expired'])

export class ProcessSignatureProviderWebhookUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const claimToken = this.dependencies.idProvider.generate()
    const claim = await this.dependencies.transaction.claimWebhookReceipt({
      receiptId: request.receiptId,
      claimToken,
      now: request.occurredAt,
      leaseUntil: new Date(request.occurredAt.getTime() + CLAIM_LEASE_MS),
    })
    if (claim.outcome === 'missing' || claim.outcome === 'busy')
      return { outcome: 'retry_required' }
    if (!('receipt' in claim)) return { outcome: 'retry_required' }

    let hint: NeutralHint | null = null
    try {
      const plaintext = await this.dependencies.cipher.decrypt({
        ciphertext: claim.receipt.encryptedHint,
        keyId: claim.receipt.cipherKeyId,
        purpose: 'webhook',
        contextId: claim.receipt.id,
      })
      hint = parseNeutralHint(JSON.parse(new TextDecoder().decode(plaintext)))
      if (!hint || hint.kind !== claim.receipt.hintKind) {
        if (claim.outcome === 'claimed') await this.failClaim(request, claimToken)
        return { outcome: 'retry_required' }
      }
    } catch {
      if (claim.outcome === 'claimed') await this.failClaim(request, claimToken)
      return { outcome: 'retry_required' }
    }

    if (hint.kind === 'reconciliation_only' || this.isTerminalHint(hint)) {
      if (claim.outcome === 'already_processed') {
        await this.publishReconciliation(hint.requestId, request.occurredAt)
        return { outcome: 'reconciliation_requested' }
      }
      const completed = await this.dependencies.transaction.completeWebhookReceiptClaim({
        receiptId: claim.receipt.id,
        expectedClaimToken: claimToken,
        processedAt: request.occurredAt,
      })
      if (completed === 'conflict') return { outcome: 'retry_required' }
      await this.publishReconciliation(hint.requestId, request.occurredAt)
      return { outcome: 'reconciliation_requested' }
    }

    const receiptUpdates =
      claim.outcome === 'claimed'
        ? [
            {
              receiptId: claim.receipt.id,
              expectedClaimToken: claimToken,
              receiptChanges: {
                status: 'processed' as const,
                claimToken: null,
                leaseUntil: null,
                processedAt: request.occurredAt,
              },
            },
          ]
        : []
    let result: 'applied' | 'conflict' | 'unchanged'
    try {
      result = await this.dependencies.transaction.recordProviderObservationAndDerive({
        observationScope: 'partial_hint',
        envelopeStatus: hint.envelopeStatus,
        receiptUpdates,
        recipientObservations: [
          {
            recipientId: hint.recipient.recipientId,
            expectedRecipientVersion: hint.recipient.expectedRecipientVersion,
            recipientChanges: {
              status:
                hint.recipient.recipientStatus === 'submitted'
                  ? 'signing'
                  : hint.recipient.recipientStatus,
            },
            recipientDocumentObservations: hint.recipient.items,
          },
        ],
        requestDocumentChanges: uniqueDocumentChanges(
          hint.recipient.items,
          request.occurredAt,
        ),
        requestId: hint.requestId,
        expectedRequestVersion: hint.expectedRequestVersion,
      })
    } catch {
      if (claim.outcome === 'claimed') await this.failClaim(request, claimToken)
      return { outcome: 'retry_required' }
    }
    if (result === 'conflict') {
      if (claim.outcome === 'claimed') await this.failClaim(request, claimToken)
      await this.publishReconciliation(hint.requestId, request.occurredAt)
      return { outcome: 'retry_required' }
    }
    await this.publishReconciliation(hint.requestId, request.occurredAt)
    return claim.outcome === 'already_processed' && result === 'unchanged'
      ? { outcome: 'already_processed' }
      : { outcome: 'processed' }
  }

  private async failClaim(request: Request, claimToken: string): Promise<void> {
    await this.dependencies.transaction.failWebhookReceiptClaim({
      receiptId: request.receiptId,
      expectedClaimToken: claimToken,
      failedAt: request.occurredAt,
      nextAttemptAt: new Date(request.occurredAt.getTime() + CLAIM_LEASE_MS),
    })
  }

  private isTerminalHint(hint: ObservationHint): boolean {
    return (
      TERMINAL_ENVELOPE_STATUSES.has(hint.envelopeStatus) ||
      TERMINAL_RECIPIENT_STATUSES.has(hint.recipient.recipientStatus) ||
      hint.recipient.items.some((item) => TERMINAL_ITEM_STATUSES.has(item.status))
    )
  }

  private async publishReconciliation(requestId: string, earliestRunAt: Date) {
    await this.dependencies.broker.publish(
      new FormalizationSignatureReconciliationRequestedEvent({
        requestId,
        reason: 'webhook',
        earliestRunAt,
      }),
    )
  }
}

const envelopeStatuses = new Set([
  'draft',
  'pending',
  'in_progress',
  'completed',
  'rejected',
  'cancelled',
  'expired',
])
const recipientStatuses = new Set([
  'invited',
  'authenticating',
  'locked',
  'authenticated',
  'reading',
  'signing',
  'submitted',
  'reconciliation_required',
  'confirmed',
  'rejected',
  'cancelled',
  'expired',
])
const itemStatuses = new Set(['pending', 'completed', 'rejected', 'cancelled', 'expired'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  return (
    actual.length === keys.length &&
    actual.every((key, index) => key === [...keys].sort()[index])
  )
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function nonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function parseNeutralHint(value: unknown): NeutralHint | null {
  if (!isRecord(value) || typeof value.kind !== 'string') return null
  if (value.kind === 'reconciliation_only') {
    return hasExactKeys(value, ['kind', 'requestId']) && identifier(value.requestId)
      ? { kind: 'reconciliation_only', requestId: value.requestId }
      : null
  }
  if (
    value.kind !== 'observation' ||
    !hasExactKeys(value, [
      'kind',
      'requestId',
      'expectedRequestVersion',
      'envelopeStatus',
      'recipient',
    ])
  )
    return null
  if (
    !identifier(value.requestId) ||
    !positiveInteger(value.expectedRequestVersion) ||
    typeof value.envelopeStatus !== 'string' ||
    !envelopeStatuses.has(value.envelopeStatus) ||
    !isRecord(value.recipient)
  )
    return null
  const recipient = value.recipient
  if (
    !hasExactKeys(recipient, [
      'recipientId',
      'expectedRecipientVersion',
      'recipientStatus',
      'items',
    ]) ||
    !identifier(recipient.recipientId) ||
    !positiveInteger(recipient.expectedRecipientVersion) ||
    typeof recipient.recipientStatus !== 'string' ||
    !recipientStatuses.has(recipient.recipientStatus) ||
    !Array.isArray(recipient.items) ||
    recipient.items.length === 0
  )
    return null
  const items = recipient.items
  if (!items.every(isNeutralItem)) return null
  if (
    new Set(items.map((item) => item.requestDocumentId)).size !== items.length ||
    new Set(items.map((item) => item.providerEnvelopeItemId)).size !== items.length
  )
    return null
  return value as unknown as ObservationHint
}

function isNeutralItem(
  value: unknown,
): value is ObservationHint['recipient']['items'][number] {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'requestDocumentId',
      'expectedVersion',
      'providerEnvelopeItemId',
      'assignment',
      'status',
      'requiredFieldCount',
      'completedFieldCount',
    ])
  )
    return false
  return (
    identifier(value.requestDocumentId) &&
    positiveInteger(value.expectedVersion) &&
    identifier(value.providerEnvelopeItemId) &&
    (value.assignment === 'required' || value.assignment === 'not_required') &&
    typeof value.status === 'string' &&
    itemStatuses.has(value.status) &&
    nonnegativeInteger(value.requiredFieldCount) &&
    nonnegativeInteger(value.completedFieldCount) &&
    value.completedFieldCount <= value.requiredFieldCount
  )
}

function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function uniqueDocumentChanges(
  items: ObservationHint['recipient']['items'],
  occurredAt: Date,
): ReadonlyArray<{
  requestDocumentId: string
  expectedVersion: number
  changes: {
    status: 'sent' | 'submitted' | 'rejected' | 'cancelled' | 'expired'
    submittedAt?: Date
    terminalAt?: Date
  }
}> {
  const changes = new Map<string, (typeof items)[number]>()
  for (const item of items) {
    const previous = changes.get(item.requestDocumentId)
    // One provider item is expected per request document. If a malformed
    // graph somehow contains two, keep the strongest monotonic observation.
    if (!previous || itemStrength(item.status) > itemStrength(previous.status))
      changes.set(item.requestDocumentId, item)
  }
  return [...changes.values()].map((item) => ({
    requestDocumentId: item.requestDocumentId,
    expectedVersion: item.expectedVersion,
    changes:
      item.status === 'completed'
        ? { status: 'submitted' as const }
        : item.status === 'rejected' ||
            item.status === 'cancelled' ||
            item.status === 'expired'
          ? { status: item.status, terminalAt: occurredAt }
          : { status: 'sent' as const },
  }))
}

function itemStrength(status: ObservationHint['recipient']['items'][number]['status']) {
  return status === 'completed' ||
    status === 'rejected' ||
    status === 'cancelled' ||
    status === 'expired'
    ? 2
    : 1
}
