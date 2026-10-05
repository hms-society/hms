import { describe, expect, it, vi } from 'vitest'
import { EditAssistedMessageUseCase } from '../edit-assisted-message-use-case'
import type { PendingsRepository } from '../../interfaces'
import type { AssistedMessage } from '../../domain/entities'

describe('EditAssistedMessageUseCase', () => {
  const mockRepo: Partial<PendingsRepository> = {
    updateMessage: vi.fn(),
  }

  it('throws error when message is not found', async () => {
    vi.mocked(mockRepo.updateMessage)!.mockResolvedValue(null as any)
    const useCase = new EditAssistedMessageUseCase(mockRepo as PendingsRepository)

    await expect(
      useCase.execute({
        pendingId: 'p-1',
        subject: ' Novo assunto ',
        body: ' Novo corpo ',
      }),
    ).rejects.toThrow('Mensagem assistida não encontrada.')
  })

  it('updates assisted message and trims fields', async () => {
    const mockMessage: Partial<AssistedMessage> = {
      id: 'm-1',
      pendingId: 'p-1',
      subject: 'Novo assunto',
      body: 'Novo corpo',
    }

    vi.mocked(mockRepo.updateMessage)!.mockResolvedValue(mockMessage as AssistedMessage)
    const useCase = new EditAssistedMessageUseCase(mockRepo as PendingsRepository)

    const result = await useCase.execute({
      pendingId: 'p-1',
      subject: '  Novo assunto  ',
      body: '  Novo corpo  ',
    })

    expect(mockRepo.updateMessage).toHaveBeenCalledWith('p-1', {
      subject: 'Novo assunto',
      body: 'Novo corpo',
    })
    expect(result).toEqual(mockMessage)
  })
})
