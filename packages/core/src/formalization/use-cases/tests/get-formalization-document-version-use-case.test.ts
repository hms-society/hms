import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { FormalizationsRepository } from '../../interfaces'
import { GetFormalizationDocumentVersionUseCase } from '../get-formalization-document-version-use-case'

describe('Get Formalization Document Version Use Case', () => {
  it('rejects a version that is not found', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed' })
    const repository = mock<FormalizationsRepository>()
    const versionsRepository = mock<DocumentVersionsRepository>()
    repository.findById.mockResolvedValue(formalization)
    versionsRepository.findById.mockResolvedValue(undefined)
    await expect(
      new GetFormalizationDocumentVersionUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        versionsRepository,
      ).execute({
        formalizationId: formalization.id,
        versionId: 'missing',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('não foi encontrada')
  })

  it('blocks version history while the contract form is open', async () => {
    const formalization = fakeFormalization()
    const repository = mock<FormalizationsRepository>()
    const versionsRepository = mock<DocumentVersionsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new GetFormalizationDocumentVersionUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        versionsRepository,
      ).execute({
        formalizationId: formalization.id,
        versionId: 'version',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('Feche o formulário')
    expect(versionsRepository.findById).not.toHaveBeenCalled()
  })
})
