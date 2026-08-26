import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { DocumentGenerationsRepository } from '../../../document-production/interfaces'
import type { Broker, DatetimeProvider } from '../../../shared/interfaces'
import type { FormalizationsRepository } from '../../interfaces'
import { CancelFormalizationDocumentGenerationUseCase } from '../cancel-formalization-document-generation-use-case'

describe('Cancel Formalization Document Generation Use Case', () => {
  it('rejects an unknown generation without publishing an event', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed' })
    const repository = mock<FormalizationsRepository>()
    const generationsRepository = mock<DocumentGenerationsRepository>()
    repository.findById.mockResolvedValue(formalization)
    generationsRepository.findById.mockResolvedValue(undefined)
    const broker = mock<Broker>()
    await expect(
      new CancelFormalizationDocumentGenerationUseCase(repository, generationsRepository, mock<DatetimeProvider>(), broker).execute({
        formalizationId: formalization.id,
        generationId: 'missing',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('não pertence')
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('blocks cancellation for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)
    const generationsRepository = mock<DocumentGenerationsRepository>()
    const broker = mock<Broker>()

    await expect(
      new CancelFormalizationDocumentGenerationUseCase(
        repository,
        generationsRepository,
        mock<DatetimeProvider>(),
        broker,
      ).execute({
        formalizationId: formalization.id,
        generationId: 'generation',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('somente leitura')
    expect(generationsRepository.findById).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
