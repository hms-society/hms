import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  DocumentPackagesRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  DocumentsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import type {
  FormalizationSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { ReplaceFormalizationDocumentSelectionUseCase } from '../replace-formalization-document-selection-use-case'

describe('Replace Formalization Document Selection Use Case', () => {
  it('blocks selection while the contract form is open', async () => {
    const formalization = fakeFormalization()
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)
    await expect(
      new ReplaceFormalizationDocumentSelectionUseCase(
        repository,
        mock<FormalizationSourceReader>(),
        mock<DocumentSpecificationsRepository>(),
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<IdProvider>(),
        mock<DatetimeProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        documentSpecificationIds: [],
      }),
    ).rejects.toThrow('Feche o formulário')
  })

  it('blocks selection changes for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new ReplaceFormalizationDocumentSelectionUseCase(
        repository,
        mock<FormalizationSourceReader>(),
        mock<DocumentSpecificationsRepository>(),
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<IdProvider>(),
        mock<DatetimeProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        documentSpecificationIds: [],
      }),
    ).rejects.toThrow('somente leitura')
  })
})
