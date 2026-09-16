import type { UseCase } from '#shared/interfaces/use-case'
import type { Pending } from '../domain/entities'
import type { PendingsRepository } from '../interfaces'

export type CancelPendingRequest = {
  pendingId: string
  cancelledBy: string
  errorReason: string
}

export class CancelPendingUseCase implements UseCase<CancelPendingRequest, Pending> {
  constructor(private readonly pendingsRepository: PendingsRepository) {}

  async execute(request: CancelPendingRequest) {
    if (!request.errorReason.trim()) {
      throw new Error('A justificativa do erro é obrigatória.')
    }

    const pending = await this.pendingsRepository.cancel(
      request.pendingId,
      request.cancelledBy,
    )

    if (!pending) throw new Error('Pendência não encontrada.')

    await this.pendingsRepository.recordAiError({
      pendingId: request.pendingId,
      reason: request.errorReason.trim(),
      recordedBy: request.cancelledBy,
    })

    return pending
  }
}
