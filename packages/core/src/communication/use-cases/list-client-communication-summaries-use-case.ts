import type { PrivateMessagesRepository } from '../interfaces'

export class ListClientCommunicationSummariesUseCase {
  constructor(private readonly privateMessagesRepository: PrivateMessagesRepository) {}

  execute() {
    return this.privateMessagesRepository.listSummariesByClient()
  }
}
