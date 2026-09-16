import type { UseCase } from '#shared/interfaces/use-case'
import type { AssistedMessage } from '../domain/entities'
import type { PendingsRepository } from '../interfaces'

export type EditAssistedMessageRequest = {
  pendingId: string
  subject: string
  body: string
  sendingInstructions: string
}

export class EditAssistedMessageUseCase
  implements UseCase<EditAssistedMessageRequest, AssistedMessage>
{
  constructor(private readonly pendingsRepository: PendingsRepository) {}

  async execute(request: EditAssistedMessageRequest) {
    const message = await this.pendingsRepository.updateMessage(request.pendingId, {
      subject: request.subject.trim(),
      body: request.body.trim(),
      sendingInstructions: request.sendingInstructions.trim(),
    })

    if (!message) throw new Error('Mensagem assistida não encontrada.')
    return message
  }
}
