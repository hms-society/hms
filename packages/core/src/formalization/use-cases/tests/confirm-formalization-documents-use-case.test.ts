import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { DocumentGenerationsRepository, DocumentPackagesRepository, DocumentVersionsRepository, PackageDocumentsRepository } from '../../../document-production/interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import type { FormalizationsRepository } from '../../interfaces'
import { ConfirmFormalizationDocumentsUseCase } from '../confirm-formalization-documents-use-case'

describe('Confirm Formalization Documents Use Case', () => {
  it('requires at least one selected document', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed', contractFormRevision: 1 })
    const repository = mock<FormalizationsRepository>()
    const packagesRepository = mock<DocumentPackagesRepository>()
    repository.findById.mockResolvedValue(formalization)
    packagesRepository.findByContext.mockResolvedValue(undefined)
    await expect(
      new ConfirmFormalizationDocumentsUseCase(
        repository,
        packagesRepository,
        mock<PackageDocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<DocumentGenerationsRepository>(),
        mock<DatetimeProvider>(),
      ).execute({ formalizationId: formalization.id, actorId: formalization.assignedLawyerId, expectedVersion: formalization.version }),
    ).rejects.toThrow('Selecione ao menos um documento')
  })

  it('blocks confirmation for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new ConfirmFormalizationDocumentsUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<DocumentGenerationsRepository>(),
        mock<DatetimeProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
      }),
    ).rejects.toThrow('somente leitura')
  })
})
