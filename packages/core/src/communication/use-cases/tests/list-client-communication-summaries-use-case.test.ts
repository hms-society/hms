import { describe, expect, it, vi } from 'vitest'
import { ListClientCommunicationSummariesUseCase } from '../list-client-communication-summaries-use-case'
import type { PrivateMessagesRepository } from '../../interfaces'

describe('ListClientCommunicationSummariesUseCase', () => {
  it('should call privateMessagesRepository.listSummariesByClient and return the result', async () => {
    const mockSummaries = [
      {
        clientId: 'client-1',
        clientName: 'Cliente Teste',
        lastMessage: 'Olá',
        lastMessageAt: new Date(),
        unreadCount: 2,
      },
    ]

    const mockRepo: Partial<PrivateMessagesRepository> = {
      listSummariesByClient: vi.fn().mockResolvedValue(mockSummaries),
    }

    const useCase = new ListClientCommunicationSummariesUseCase(
      mockRepo as PrivateMessagesRepository,
    )

    const result = await useCase.execute()

    expect(mockRepo.listSummariesByClient).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockSummaries)
  })
})
