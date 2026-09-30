import { describe, expect, it, vi } from 'vitest'
import { ApproveAssistedMessageUseCase } from '../approve-assisted-message-use-case'
import type { PendingsRepository } from '../../interfaces'
import type { AssistedMessage } from '../../domain/entities'

describe('ApproveAssistedMessageUseCase', () => {
  const mockRepo: Partial<PendingsRepository> = {
    approveMessage: vi.fn(),
  }

  it('throws error when message is not found', async () => {
    vi.mocked(mockRepo.approveMessage)!.mockResolvedValue(null as any)
    const useCase = new ApproveAssistedMessageUseCase(mockRepo as PendingsRepository)

    await expect(
      useCase.execute({ pendingId: 'p-1', approvedBy: 'u-1' }),
    ).rejects.toThrow('Mensagem assistida não encontrada.')
  })

  it('approves assisted message and returns it', async () => {
    const mockMessage: Partial<AssistedMessage> = {
      id: 'm-1',
      pendingId: 'p-1',
      status: 'approved',
    }

    vi.mocked(mockRepo.approveMessage)!.mockResolvedValue(mockMessage as AssistedMessage)
    const useCase = new ApproveAssistedMessageUseCase(mockRepo as PendingsRepository)

    const result = await useCase.execute({ pendingId: 'p-1', approvedBy: 'u-1' })

    expect(mockRepo.approveMessage).toHaveBeenCalledWith('p-1', 'u-1')
    expect(result).toEqual(mockMessage)
  })
})
