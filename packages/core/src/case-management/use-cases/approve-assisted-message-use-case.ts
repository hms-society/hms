import type { UseCase } from '#shared/interfaces/use-case'
import type { AssistedMessage } from '../domain/entities'
import type { PendingsRepository } from '../interfaces'

export class ApproveAssistedMessageUseCase
  implements UseCase<{ pendingId: string; approvedBy: string }, AssistedMessage>
{
  constructor(private readonly pendingsRepository: PendingsRepository) {}

  async execute(request: { pendingId: string; approvedBy: string }) {
    const message = await this.pendingsRepository.approveMessage(
      request.pendingId,
      request.approvedBy,
    )

    if (!message) throw new Error('Mensagem assistida não encontrada.')
    return message
  }
}
