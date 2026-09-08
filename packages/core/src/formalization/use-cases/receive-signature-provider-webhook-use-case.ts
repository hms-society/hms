import type { DatetimeProvider, IdProvider, UseCase } from '../../shared/interfaces'
import type { FormalizationSignatureWebhookReceipt } from '../domain/entities'
import type { FormalizationSignatureWebhookReceiptsRepository } from '../interfaces'

type Request = {
  readonly dedupeKey: string
  readonly hintKind: 'observation' | 'reconciliation_only'
  readonly encryptedHint: string
  readonly cipherKeyId: string
  readonly receivedAt: Date
}
type Response = { readonly receiptId: string; readonly duplicate: boolean }
type Dependencies = {
  readonly receiptsRepository: FormalizationSignatureWebhookReceiptsRepository
  readonly idProvider: IdProvider
  readonly datetimeProvider: DatetimeProvider
}

export class ReceiveSignatureProviderWebhookUseCase
  implements UseCase<Request, Response>
{
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<Response> {
    const existing = await this.dependencies.receiptsRepository.findByDedupeKey(
      request.dedupeKey,
    )
    if (existing) return { receiptId: existing.id, duplicate: true }
    const receipt: FormalizationSignatureWebhookReceipt = {
      id: this.dependencies.idProvider.generate(),
      dedupeKey: request.dedupeKey,
      hintKind: request.hintKind,
      encryptedHint: request.encryptedHint,
      cipherKeyId: request.cipherKeyId,
      status: 'pending',
      receivedAt: request.receivedAt,
      attempts: 0,
    }
    try {
      await this.dependencies.receiptsRepository.add(receipt)
      return { receiptId: receipt.id, duplicate: false }
    } catch (error) {
      // The dedupe key is unique in the persistence boundary. A concurrent
      // winner is the canonical receipt; never return the losing generated ID.
      const canonical = await this.dependencies.receiptsRepository.findByDedupeKey(
        request.dedupeKey,
      )
      if (canonical) return { receiptId: canonical.id, duplicate: true }
      throw error
    }
  }
}
