import { describe, expect, it, vi } from 'vitest'
import { ListClientCommunicationSummariesController } from '../list-client-communication-summaries.controller'
import type { PrivateMessagesRepository } from '@hms/core/communication/interfaces'

describe('ListClientCommunicationSummariesController', () => {
  it('delegates execution to the use case and returns summaries', async () => {
    const mockSummaries = [
      {
        clientId: 'client-1',
        clientName: 'Cliente Teste',
        lastMessage: 'Mensagem recente',
        lastMessageAt: new Date(),
        unreadCount: 1,
      },
    ]

    const mockRepo: Partial<PrivateMessagesRepository> = {
      listSummariesByClient: vi.fn().mockResolvedValue(mockSummaries),
    }

    const controller = new ListClientCommunicationSummariesController(
      mockRepo as PrivateMessagesRepository,
    )

    const result = await controller.handle()

    expect(mockRepo.listSummariesByClient).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockSummaries)
  })
})
