import { describe, expect, it, vi } from 'vitest'
import { PendingReason } from '../../domain/structures'
import { CreatePendingUseCase } from '../create-pending-use-case'

describe('CreatePendingUseCase', () => {
  it('creates one deterministic approval message for an illegible document', async () => {
    const repository = {
      createWithMessage: vi.fn().mockResolvedValue({
        pending: { id: 'pending-1' },
        message: { id: 'message-1' },
      }),
    }
    const useCase = new CreatePendingUseCase(repository as never)

    await useCase.execute({
      caseId: 'case-1',
      checklistItemId: 'item-1',
      documentFileId: 'file-1',
      documentFileName: 'RG.pdf',
      reason: PendingReason.Illegible,
      responsibleId: 'collaborator-1',
    })

    expect(repository.createWithMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        pending: expect.objectContaining({ reason: PendingReason.Illegible }),
        message: expect.objectContaining({
          status: 'awaiting_approval',
          subject: 'Novo envio necessário: RG.pdf',
          body: expect.stringContaining('ilegível'),
        }),
      }),
    )
  })
})
