import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { FormalizationsRepository } from '../../interfaces'
import { SelectCurrentFormalizationDocumentVersionUseCase } from '../select-current-formalization-document-version-use-case'

describe('Select Current Formalization Document Version Use Case', () => {
  it('blocks changing the current version after confirmation', async () => {
    const formalization = fakeFormalization({
      contractFormState: 'closed',
      documentsConfirmedAt: new Date(),
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)
    await expect(
      new SelectCurrentFormalizationDocumentVersionUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
      ).execute({
        formalizationId: formalization.id,
        documentId: 'document',
        versionId: 'version',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('Reabra a confirmação')
  })

  it('blocks changing the current version for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new SelectCurrentFormalizationDocumentVersionUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
      ).execute({
        formalizationId: formalization.id,
        documentId: 'document',
        versionId: 'version',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('somente leitura')
  })
})
