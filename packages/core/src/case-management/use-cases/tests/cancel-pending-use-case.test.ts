import { describe, expect, it, vi } from 'vitest'
import { CancelPendingUseCase } from '../cancel-pending-use-case'
import type { PendingsRepository } from '../../interfaces'
import type { Pending } from '../../domain/entities'

describe('CancelPendingUseCase', () => {
  const mockRepo: Partial<PendingsRepository> = {
    cancel: vi.fn(),
    recordAiError: vi.fn(),
  }

  it('throws error when errorReason is empty or only whitespace', async () => {
    const useCase = new CancelPendingUseCase(mockRepo as PendingsRepository)

    await expect(
      useCase.execute({
        pendingId: 'pending-1',
        cancelledBy: 'user-1',
        errorReason: '   ',
      }),
    ).rejects.toThrow('A justificativa do erro é obrigatória.')
  })

  it('throws error when pending is not found', async () => {
    vi.mocked(mockRepo.cancel)!.mockResolvedValue(null as any)

    const useCase = new CancelPendingUseCase(mockRepo as PendingsRepository)

    await expect(
      useCase.execute({
        pendingId: 'pending-1',
        cancelledBy: 'user-1',
        errorReason: 'Documento incorreto',
      }),
    ).rejects.toThrow('Pendência não encontrada.')
  })

  it('cancels pending and records AI error successfully', async () => {
    const mockPending: Partial<Pending> = {
      id: 'pending-1',
      caseId: 'case-1',
      cancelledAt: new Date(),
      cancelledBy: 'user-1',
    }

    vi.mocked(mockRepo.cancel)!.mockResolvedValue(mockPending as Pending)
    vi.mocked(mockRepo.recordAiError)!.mockResolvedValue(undefined as any)

    const useCase = new CancelPendingUseCase(mockRepo as PendingsRepository)

    const result = await useCase.execute({
      pendingId: 'pending-1',
      cancelledBy: 'user-1',
      errorReason: 'Documento incorreto gerado pela IA',
    })

    expect(mockRepo.cancel).toHaveBeenCalledWith('pending-1', 'user-1')
    expect(mockRepo.recordAiError).toHaveBeenCalledWith({
      pendingId: 'pending-1',
      reason: 'Documento incorreto gerado pela IA',
      recordedBy: 'user-1',
    })
    expect(result).toEqual(mockPending)
  })
})
