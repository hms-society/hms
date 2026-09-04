import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ProcessSignatureProviderWebhookUseCase } from '../process-signature-provider-webhook-use-case'
import { fakeFormalizationSignatureWebhookReceipt } from '../../domain/entities/fakers'
import type {
  FormalizationSignatureGatewayTransaction,
  SensitivePayloadCipherProvider,
} from '../../interfaces'
import type { Broker, IdProvider } from '../../../shared/interfaces'

const NOW = new Date('2026-01-01T12:00:00.000Z')

function makeDependencies() {
  const cipher = mock<SensitivePayloadCipherProvider>()
  const transaction = mock<FormalizationSignatureGatewayTransaction>()
  const idProvider = mock<IdProvider>()
  const broker = mock<Broker>()
  const receipt = fakeFormalizationSignatureWebhookReceipt({
    id: 'receipt-1',
    dedupeKey: 'dedupe-1',
    status: 'pending',
    attempts: 2,
    hintKind: 'observation',
    encryptedHint: 'ciphertext',
    cipherKeyId: 'key-1',
  })
  const hint = {
    kind: 'observation' as const,
    requestId: 'request-1',
    expectedRequestVersion: 4,
    envelopeStatus: 'in_progress' as const,
    recipient: {
      recipientId: 'recipient-1',
      expectedRecipientVersion: 2,
      recipientStatus: 'signing' as const,
      items: [
        {
          requestDocumentId: 'document-1',
          expectedVersion: 1,
          providerEnvelopeItemId: 'item-1',
          assignment: 'required' as const,
          status: 'pending' as const,
          requiredFieldCount: 1,
          completedFieldCount: 0,
        },
      ],
    },
  }
  cipher.decrypt.mockResolvedValue(new TextEncoder().encode(JSON.stringify(hint)))
  transaction.claimWebhookReceipt.mockResolvedValue({ outcome: 'claimed', receipt })
  transaction.recordProviderObservationAndDerive.mockResolvedValue('applied')
  transaction.failWebhookReceiptClaim.mockResolvedValue('applied')
  broker.publish.mockResolvedValue()
  idProvider.generate.mockReturnValue('claim-1')
  return { cipher, transaction, idProvider, broker, receipt, hint }
}

function execute(dependencies: ReturnType<typeof makeDependencies>) {
  return new ProcessSignatureProviderWebhookUseCase(dependencies).execute({
    receiptId: dependencies.receipt.id,
    occurredAt: NOW,
  })
}

describe('Process Signature Provider Webhook Use Case', () => {
  it('claims by primary key with a fresh 30-second token and records one safe hint', async () => {
    const dependencies = makeDependencies()

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'processed' })
    expect(dependencies.transaction.claimWebhookReceipt).toHaveBeenCalledWith({
      receiptId: 'receipt-1',
      claimToken: 'claim-1',
      now: NOW,
      leaseUntil: new Date('2026-01-01T12:00:30.000Z'),
    })
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        receiptUpdates: [
          {
            receiptId: 'receipt-1',
            expectedClaimToken: 'claim-1',
            receiptChanges: expect.objectContaining({
              status: 'processed',
              claimToken: null,
              leaseUntil: null,
            }),
          },
        ],
        recipientObservations: [expect.objectContaining({ recipientId: 'recipient-1' })],
        observationScope: 'partial_hint',
      }),
    )
    expect(dependencies.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ requestId: 'request-1' }),
      }),
    )
  })

  it('does not let claim A finalize after the same worker reclaims as claim B', async () => {
    const dependencies = makeDependencies()
    const claimA = dependencies.receipt
    const claimB = {
      ...dependencies.receipt,
      claimToken: 'claim-b',
      status: 'processing' as const,
    }
    dependencies.idProvider.generate
      .mockReturnValueOnce('claim-a')
      .mockReturnValueOnce('claim-b')
    dependencies.transaction.claimWebhookReceipt
      .mockResolvedValueOnce({ outcome: 'claimed', receipt: claimA })
      .mockResolvedValueOnce({ outcome: 'claimed', receipt: claimB })
    dependencies.transaction.recordProviderObservationAndDerive
      .mockResolvedValueOnce('conflict')
      .mockResolvedValueOnce('applied')

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'retry_required' })
    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'processed' })
    expect(dependencies.transaction.failWebhookReceiptClaim).toHaveBeenCalledWith({
      receiptId: 'receipt-1',
      expectedClaimToken: 'claim-a',
      failedAt: NOW,
      nextAttemptAt: new Date('2026-01-01T12:00:30.000Z'),
    })
    const calls = dependencies.transaction.recordProviderObservationAndDerive.mock.calls
    expect(calls[0]?.[0].receiptUpdates[0]?.expectedClaimToken).toBe('claim-a')
    expect(calls[1]?.[0].receiptUpdates[0]?.expectedClaimToken).toBe('claim-b')
  })

  it('replays an already processed receipt without rewriting it or suppressing newer safe state', async () => {
    const dependencies = makeDependencies()
    dependencies.transaction.claimWebhookReceipt.mockResolvedValue({
      outcome: 'already_processed',
      receipt: { ...dependencies.receipt, status: 'processed' },
    })
    dependencies.transaction.recordProviderObservationAndDerive.mockResolvedValue(
      'unchanged',
    )

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'already_processed' })
    expect(
      dependencies.transaction.recordProviderObservationAndDerive.mock.calls[0]?.[0]
        .receiptUpdates,
    ).toEqual([])
    expect(dependencies.transaction.failWebhookReceiptClaim).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ requestId: 'request-1' }),
      }),
    )
  })

  it.each([
    'missing',
    'busy',
  ] as const)('returns retry_required for a %s claim without publishing', async (outcome) => {
    const dependencies = makeDependencies()
    dependencies.transaction.claimWebhookReceipt.mockResolvedValue({ outcome })

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'retry_required' })
    expect(dependencies.cipher.decrypt).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
  })

  it('fails only the owned claim on malformed or undecryptable payloads', async () => {
    const dependencies = makeDependencies()
    dependencies.cipher.decrypt.mockRejectedValue(new Error('cipher unavailable'))

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'retry_required' })
    expect(dependencies.transaction.failWebhookReceiptClaim).toHaveBeenCalledWith({
      receiptId: 'receipt-1',
      expectedClaimToken: 'claim-1',
      failedAt: NOW,
      nextAttemptAt: new Date('2026-01-01T12:00:30.000Z'),
    })
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
  })

  it('does not fail or publish when an already processed payload is malformed', async () => {
    const dependencies = makeDependencies()
    dependencies.transaction.claimWebhookReceipt.mockResolvedValue({
      outcome: 'already_processed',
      receipt: { ...dependencies.receipt, status: 'processed' },
    })
    dependencies.cipher.decrypt.mockResolvedValue(new TextEncoder().encode('{}'))

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'retry_required' })
    expect(dependencies.transaction.failWebhookReceiptClaim).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
  })

  it('completes a claimed reconciliation-only receipt without mutating the graph', async () => {
    const dependencies = makeDependencies()
    dependencies.receipt.hintKind = 'reconciliation_only'
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(
        JSON.stringify({ kind: 'reconciliation_only', requestId: 'request-1' }),
      ),
    )
    dependencies.transaction.completeWebhookReceiptClaim.mockResolvedValue('applied')

    await expect(execute(dependencies)).resolves.toEqual({
      outcome: 'reconciliation_requested',
    })
    expect(dependencies.transaction.completeWebhookReceiptClaim).toHaveBeenCalledWith({
      receiptId: 'receipt-1',
      expectedClaimToken: 'claim-1',
      processedAt: NOW,
    })
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ requestId: 'request-1' }),
      }),
    )
  })

  it('does not publish or mutate the graph when reconciliation-only completion conflicts', async () => {
    const dependencies = makeDependencies()
    dependencies.receipt.hintKind = 'reconciliation_only'
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(
        JSON.stringify({ kind: 'reconciliation_only', requestId: 'request-1' }),
      ),
    )
    dependencies.transaction.completeWebhookReceiptClaim.mockResolvedValue('conflict')

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'retry_required' })
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).not.toHaveBeenCalled()
  })

  it('replays a processed reconciliation-only receipt without a receipt write', async () => {
    const dependencies = makeDependencies()
    dependencies.receipt.hintKind = 'reconciliation_only'
    dependencies.transaction.claimWebhookReceipt.mockResolvedValue({
      outcome: 'already_processed',
      receipt: { ...dependencies.receipt, status: 'processed' },
    })
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(
        JSON.stringify({ kind: 'reconciliation_only', requestId: 'request-1' }),
      ),
    )

    await expect(execute(dependencies)).resolves.toEqual({
      outcome: 'reconciliation_requested',
    })
    expect(dependencies.transaction.completeWebhookReceiptClaim).not.toHaveBeenCalled()
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['unknown kind', { kind: 'other', requestId: 'request-1' }],
    [
      'unknown envelope status',
      { ...makeDependencies().hint, kind: 'observation', envelopeStatus: 'unknown' },
    ],
    [
      'unknown recipient status',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: { ...makeDependencies().hint.recipient, recipientStatus: 'unknown' },
      },
    ],
    [
      'unknown item status',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          items: [{ ...makeDependencies().hint.recipient.items[0], status: 'unknown' }],
        },
      },
    ],
    [
      'unknown assignment',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          items: [
            { ...makeDependencies().hint.recipient.items[0], assignment: 'optional' },
          ],
        },
      },
    ],
    [
      'non-positive request version',
      { ...makeDependencies().hint, kind: 'observation', expectedRequestVersion: 0 },
    ],
    [
      'obsolete aggregate version key',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        expectedFormalizationVersion: 0,
      },
    ],
    [
      'non-positive recipient version',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: { ...makeDependencies().hint.recipient, expectedRecipientVersion: 0 },
      },
    ],
    [
      'noninteger request version',
      { ...makeDependencies().hint, kind: 'observation', expectedRequestVersion: 1.5 },
    ],
    [
      'noninteger recipient version',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          expectedRecipientVersion: 1.5,
        },
      },
    ],
    [
      'non-positive item version',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          items: [{ ...makeDependencies().hint.recipient.items[0], expectedVersion: 0 }],
        },
      },
    ],
    [
      'noninteger count',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          items: [
            { ...makeDependencies().hint.recipient.items[0], completedFieldCount: 0.5 },
          ],
        },
      },
    ],
    [
      'negative field count',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          items: [
            { ...makeDependencies().hint.recipient.items[0], requiredFieldCount: -1 },
          ],
        },
      },
    ],
    [
      'completed fields above required',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          items: [
            {
              ...makeDependencies().hint.recipient.items[0],
              requiredFieldCount: 1,
              completedFieldCount: 2,
            },
          ],
        },
      },
    ],
    [
      'empty request ID',
      { ...makeDependencies().hint, kind: 'observation', requestId: '' },
    ],
    [
      'empty recipient ID',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: { ...makeDependencies().hint.recipient, recipientId: '' },
      },
    ],
    [
      'empty provider item ID',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          items: [
            { ...makeDependencies().hint.recipient.items[0], providerEnvelopeItemId: '' },
          ],
        },
      },
    ],
    [
      'extra top-level key',
      { ...makeDependencies().hint, kind: 'observation', extra: true },
    ],
    [
      'extra recipient key',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: { ...makeDependencies().hint.recipient, extra: true },
      },
    ],
    [
      'extra item key',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: {
          ...makeDependencies().hint.recipient,
          items: [{ ...makeDependencies().hint.recipient.items[0], extra: true }],
        },
      },
    ],
    ['hint-kind mismatch', { kind: 'reconciliation_only', requestId: 'request-1' }],
    [
      'empty items',
      {
        ...makeDependencies().hint,
        kind: 'observation',
        recipient: { ...makeDependencies().hint.recipient, items: [] },
      },
    ],
  ])('fails malformed neutral hint (%s) for the owned claim', async (_name, malformed) => {
    const dependencies = makeDependencies()
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(JSON.stringify(malformed)),
    )

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'retry_required' })
    expect(dependencies.transaction.failWebhookReceiptClaim).toHaveBeenCalledWith(
      expect.objectContaining({ receiptId: 'receipt-1', expectedClaimToken: 'claim-1' }),
    )
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).not.toHaveBeenCalled()
  })

  it('accepts completed counts below required counts without publishing untrusted data', async () => {
    const dependencies = makeDependencies()
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(
        JSON.stringify({
          ...dependencies.hint,
          recipient: {
            ...dependencies.hint.recipient,
            items: [
              {
                ...dependencies.hint.recipient.items[0],
                requiredFieldCount: 2,
                completedFieldCount: 1,
              },
            ],
          },
        }),
      ),
    )
    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'processed' })
    expect(dependencies.broker.publish).toHaveBeenCalledTimes(1)
    expect(dependencies.transaction.failWebhookReceiptClaim).not.toHaveBeenCalled()
  })

  it('completes a terminal recipient hint for reconciliation without speculative graph writes', async () => {
    const dependencies = makeDependencies()
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(
        JSON.stringify({
          ...dependencies.hint,
          recipient: {
            ...dependencies.hint.recipient,
            recipientStatus: 'rejected',
          },
        }),
      ),
    )
    dependencies.transaction.completeWebhookReceiptClaim.mockResolvedValue('applied')

    await expect(execute(dependencies)).resolves.toEqual({
      outcome: 'reconciliation_requested',
    })
    expect(dependencies.transaction.completeWebhookReceiptClaim).toHaveBeenCalledWith({
      receiptId: 'receipt-1',
      expectedClaimToken: 'claim-1',
      processedAt: NOW,
    })
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).not.toHaveBeenCalled()
    expect(dependencies.transaction.failWebhookReceiptClaim).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ requestId: 'request-1' }),
      }),
    )
  })

  it.each([
    [
      'completed envelope',
      { envelopeStatus: 'completed', recipientStatus: undefined, itemStatus: undefined },
    ],
    [
      'cancelled envelope',
      { envelopeStatus: 'cancelled', recipientStatus: undefined, itemStatus: undefined },
    ],
    [
      'confirmed recipient',
      { envelopeStatus: undefined, recipientStatus: 'confirmed', itemStatus: undefined },
    ],
    [
      'expired recipient',
      { envelopeStatus: undefined, recipientStatus: 'expired', itemStatus: undefined },
    ],
    [
      'completed item',
      { envelopeStatus: undefined, recipientStatus: undefined, itemStatus: 'completed' },
    ],
    [
      'rejected item',
      { envelopeStatus: undefined, recipientStatus: undefined, itemStatus: 'rejected' },
    ],
  ] as const)('routes a %s partial hint through receipt-only reconciliation', async (_label, terminal) => {
    const dependencies = makeDependencies()
    dependencies.transaction.completeWebhookReceiptClaim.mockResolvedValue('applied')
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(
        JSON.stringify({
          ...dependencies.hint,
          ...(terminal.envelopeStatus ? { envelopeStatus: terminal.envelopeStatus } : {}),
          recipient: {
            ...dependencies.hint.recipient,
            ...(terminal.recipientStatus
              ? { recipientStatus: terminal.recipientStatus }
              : {}),
            items: dependencies.hint.recipient.items.map((item) => ({
              ...item,
              ...(terminal.itemStatus ? { status: terminal.itemStatus } : {}),
            })),
          },
        }),
      ),
    )

    await expect(execute(dependencies)).resolves.toEqual({
      outcome: 'reconciliation_requested',
    })
    expect(dependencies.transaction.completeWebhookReceiptClaim).toHaveBeenCalledOnce()
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).toHaveBeenCalledOnce()
  })

  it.each([
    'requestDocumentId',
    'providerEnvelopeItemId',
  ] as const)('rejects duplicate %s values without mutating the graph', async (duplicateField) => {
    const dependencies = makeDependencies()
    const item = dependencies.hint.recipient.items[0]
    const duplicateItem = {
      ...item,
      requestDocumentId:
        duplicateField === 'requestDocumentId' ? item.requestDocumentId : 'document-2',
      providerEnvelopeItemId:
        duplicateField === 'providerEnvelopeItemId'
          ? item.providerEnvelopeItemId
          : 'item-2',
    }
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(
        JSON.stringify({
          ...dependencies.hint,
          recipient: {
            ...dependencies.hint.recipient,
            items: [item, duplicateItem],
          },
        }),
      ),
    )

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'retry_required' })
    expect(dependencies.transaction.failWebhookReceiptClaim).toHaveBeenCalledWith(
      expect.objectContaining({ receiptId: 'receipt-1', expectedClaimToken: 'claim-1' }),
    )
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).not.toHaveBeenCalled()
    expect(dependencies.transaction.completeWebhookReceiptClaim).not.toHaveBeenCalled()
    expect(dependencies.broker.publish).not.toHaveBeenCalled()
  })

  it('accepts opaque non-UUID identifiers allowed by the neutral contract', async () => {
    const dependencies = makeDependencies()
    const opaqueHint = {
      ...dependencies.hint,
      requestId: 'request/provider-1',
      recipient: {
        ...dependencies.hint.recipient,
        recipientId: 'recipient#1',
        items: [
          {
            ...dependencies.hint.recipient.items[0],
            requestDocumentId: 'document/provider-1',
            providerEnvelopeItemId: 'item:1',
          },
        ],
      },
    }
    dependencies.cipher.decrypt.mockResolvedValue(
      new TextEncoder().encode(JSON.stringify(opaqueHint)),
    )

    await expect(execute(dependencies)).resolves.toEqual({ outcome: 'processed' })
    expect(
      dependencies.transaction.recordProviderObservationAndDerive,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'request/provider-1',
        recipientObservations: [
          expect.objectContaining({
            recipientId: 'recipient#1',
            recipientDocumentObservations: [
              expect.objectContaining({
                requestDocumentId: 'document/provider-1',
                providerEnvelopeItemId: 'item:1',
              }),
            ],
          }),
        ],
      }),
    )
  })
})
