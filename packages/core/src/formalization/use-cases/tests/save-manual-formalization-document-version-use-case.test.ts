import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  DocumentFileExporter,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import type {
  DatetimeProvider,
  FileStorageProvider,
  IdProvider,
} from '../../../shared/interfaces'
import type { FormalizationsRepository } from '../../interfaces'
import { SaveManualFormalizationDocumentVersionUseCase } from '../save-manual-formalization-document-version-use-case'

describe('Save Manual Formalization Document Version Use Case', () => {
  it('blocks manual edits until the form is closed', async () => {
    const formalization = fakeFormalization()
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)
    await expect(
      new SaveManualFormalizationDocumentVersionUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<DocumentFileExporter>(),
        mock<FileStorageProvider>(),
        mock<DatetimeProvider>(),
        mock<IdProvider>(),
      ).execute({
        formalizationId: formalization.id,
        documentId: 'document',
        sourceDocumentVersionId: 'version',
        actorId: formalization.assignedLawyerId,
        content: { type: 'doc' },
      }),
    ).rejects.toThrow('Feche o formulário')
  })

  it('blocks manual edits for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new SaveManualFormalizationDocumentVersionUseCase(
        repository,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentsRepository>(),
        mock<DocumentVersionsRepository>(),
        mock<DocumentFileExporter>(),
        mock<FileStorageProvider>(),
        mock<DatetimeProvider>(),
        mock<IdProvider>(),
      ).execute({
        formalizationId: formalization.id,
        documentId: 'document',
        sourceDocumentVersionId: 'version',
        actorId: formalization.assignedLawyerId,
        content: { type: 'doc' },
      }),
    ).rejects.toThrow('somente leitura')
  })
})
