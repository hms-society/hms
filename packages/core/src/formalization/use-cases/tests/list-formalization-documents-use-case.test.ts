import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { DocumentGenerationsRepository, DocumentPackagesRepository, DocumentsRepository, DocumentVersionsRepository, PackageDocumentsRepository } from '../../../document-production/interfaces'
import type { FormalizationsRepository } from '../../interfaces'
import { ListFormalizationDocumentsUseCase } from '../list-formalization-documents-use-case'

describe('List Formalization Documents Use Case', () => {
  it('returns no documents when no package has been selected', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed', contractFormRevision: 1 })
    const repository = mock<FormalizationsRepository>()
    const packagesRepository = mock<DocumentPackagesRepository>()
    repository.findById.mockResolvedValue(formalization)
    packagesRepository.findByContext.mockResolvedValue(undefined)
    await expect(
      new ListFormalizationDocumentsUseCase(
        repository,
        packagesRepository,
        mock<PackageDocumentsRepository>(),
        mock<DocumentsRepository>(),
        mock<DocumentGenerationsRepository>(),
        mock<DocumentVersionsRepository>(),
      ).execute({ formalizationId: formalization.id, actorId: formalization.assignedLawyerId }),
    ).resolves.toEqual([])
  })
})
