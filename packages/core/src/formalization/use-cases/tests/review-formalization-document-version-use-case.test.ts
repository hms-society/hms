import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { DocumentPackagesRepository, DocumentVersionsRepository, PackageDocumentsRepository } from '../../../document-production/interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import type { FormalizationsRepository } from '../../interfaces'
import { ReviewFormalizationDocumentVersionUseCase } from '../review-formalization-document-version-use-case'

describe('Review Formalization Document Version Use Case', () => {
  it('blocks review after terminal package confirmation', async () => {
    const formalization = fakeFormalization({
      contractFormState: 'closed',
      documentsConfirmedAt: new Date(),
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)
    await expect(
      new ReviewFormalizationDocumentVersionUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<DatetimeProvider>(),
      ).execute({ formalizationId: formalization.id, versionId: 'version', actorId: formalization.assignedLawyerId, status: 'approved' }),
    ).rejects.toThrow('Reabra a confirmação')
  })

  it('blocks review for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new ReviewFormalizationDocumentVersionUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<DatetimeProvider>(),
      ).execute({
        formalizationId: formalization.id,
        versionId: 'version',
        actorId: formalization.assignedLawyerId,
        status: 'approved',
      }),
    ).rejects.toThrow('somente leitura')
  })
})
