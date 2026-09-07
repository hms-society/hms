import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ReceiveSignatureProviderWebhookUseCase } from '../receive-signature-provider-webhook-use-case'
import type { FormalizationSignatureWebhookReceiptsRepository } from '../../interfaces'
import type { IdProvider, DatetimeProvider } from '../../../shared/interfaces'

describe('Receive Signature Provider Webhook Use Case', () => {
  it('deduplicates an already persisted receipt', async () => {
    const receiptsRepository = mock<FormalizationSignatureWebhookReceiptsRepository>()
    const existing = { id: 'receipt-1' } as Awaited<
      ReturnType<FormalizationSignatureWebhookReceiptsRepository['findByDedupeKey']>
    >
    receiptsRepository.findByDedupeKey.mockResolvedValue(existing)
    const useCase = new ReceiveSignatureProviderWebhookUseCase({
      receiptsRepository,
      idProvider: mock<IdProvider>(),
      datetimeProvider: mock<DatetimeProvider>(),
    })

    const result = await useCase.execute({
      dedupeKey: 'event-1',
      hintKind: 'observation',
      encryptedHint: 'ciphertext',
      cipherKeyId: 'key-1',
      receivedAt: new Date('2026-01-01'),
    })

    expect(result).toEqual({ receiptId: 'receipt-1', duplicate: true })
    expect(receiptsRepository.add).not.toHaveBeenCalled()
  })

  it('persists only the provider-neutral reconciliation hint fields', async () => {
    const receiptsRepository = mock<FormalizationSignatureWebhookReceiptsRepository>()
    receiptsRepository.findByDedupeKey.mockResolvedValue(null)
    const idProvider = mock<IdProvider>()
    idProvider.generate.mockReturnValue('receipt-1')
    const datetimeProvider = mock<DatetimeProvider>()
    const receivedAt = new Date('2026-01-01')
    datetimeProvider.now.mockReturnValue(receivedAt)
    const useCase = new ReceiveSignatureProviderWebhookUseCase({
      receiptsRepository,
      idProvider,
      datetimeProvider,
    })

    await expect(
      useCase.execute({
        dedupeKey: 'dedupe-1',
        hintKind: 'reconciliation_only',
        encryptedHint: 'ciphertext',
        cipherKeyId: 'key-1',
        receivedAt,
      }),
    ).resolves.toEqual({ receiptId: 'receipt-1', duplicate: false })

    expect(receiptsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'receipt-1',
        dedupeKey: 'dedupe-1',
        hintKind: 'reconciliation_only',
        encryptedHint: 'ciphertext',
        cipherKeyId: 'key-1',
      }),
    )
    const persisted = receiptsRepository.add.mock.calls[0]?.[0]
    expect(Object.keys(persisted ?? {}).sort()).toEqual([
      'attempts',
      'cipherKeyId',
      'dedupeKey',
      'encryptedHint',
      'hintKind',
      'id',
      'receivedAt',
      'status',
    ])
  })

  it('returns the canonical receipt when add loses a concurrent dedupe race', async () => {
    const receiptsRepository = mock<FormalizationSignatureWebhookReceiptsRepository>()
    const canonical = {
      id: 'receipt-winner',
    } as Awaited<
      ReturnType<FormalizationSignatureWebhookReceiptsRepository['findByDedupeKey']>
    >
    receiptsRepository.findByDedupeKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(canonical)
    receiptsRepository.add.mockRejectedValue(new Error('unique violation'))
    const idProvider = mock<IdProvider>()
    idProvider.generate.mockReturnValue('receipt-loser')
    const useCase = new ReceiveSignatureProviderWebhookUseCase({
      receiptsRepository,
      idProvider,
      datetimeProvider: mock<DatetimeProvider>(),
    })

    await expect(
      useCase.execute({
        dedupeKey: 'dedupe-1',
        hintKind: 'observation',
        encryptedHint: 'ciphertext',
        cipherKeyId: 'key-1',
        receivedAt: new Date('2026-01-01'),
      }),
    ).resolves.toEqual({ receiptId: 'receipt-winner', duplicate: true })
    expect(receiptsRepository.findByDedupeKey).toHaveBeenCalledTimes(2)
  })

  it('rethrows an add failure when no canonical receipt can be reread', async () => {
    const receiptsRepository = mock<FormalizationSignatureWebhookReceiptsRepository>()
    const failure = new Error('database unavailable')
    receiptsRepository.findByDedupeKey.mockResolvedValue(null)
    receiptsRepository.add.mockRejectedValue(failure)
    const useCase = new ReceiveSignatureProviderWebhookUseCase({
      receiptsRepository,
      idProvider: mock<IdProvider>(),
      datetimeProvider: mock<DatetimeProvider>(),
    })

    await expect(
      useCase.execute({
        dedupeKey: 'dedupe-1',
        hintKind: 'observation',
        encryptedHint: 'ciphertext',
        cipherKeyId: 'key-1',
        receivedAt: new Date('2026-01-01'),
      }),
    ).rejects.toBe(failure)
  })
})
