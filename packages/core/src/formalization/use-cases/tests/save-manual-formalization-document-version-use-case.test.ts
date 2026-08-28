import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import {
  DocumentFaker,
  DocumentVersionFaker,
} from '../../../document-production/domain/entities/fakers'
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

  it('removes the stored file when version persistence fails', async () => {
    const formalization = fakeFormalization({ contractFormState: 'closed' })
    const document = DocumentFaker.fake()
    const sourceVersion = DocumentVersionFaker.fake({ documentId: document.id })
    const createdAt = new Date('2026-08-11T12:00:00.000Z')
    const storedFile = {
      id: 'stored-file-id',
      filePath: 'stored/path',
      fileName: 'document.docx',
      contentType: 'application/docx',
      sizeInBytes: 1,
      createdAt,
    }
    const repository = mock<FormalizationsRepository>()
    const documentPackagesRepository = mock<DocumentPackagesRepository>()
    const packageDocumentsRepository = mock<PackageDocumentsRepository>()
    const documentsRepository = mock<DocumentsRepository>()
    const versionsRepository = mock<DocumentVersionsRepository>()
    const documentFileExporter = mock<DocumentFileExporter>()
    const fileStorageProvider = mock<FileStorageProvider>()
    const datetimeProvider = mock<DatetimeProvider>()
    const idProvider = mock<IdProvider>()
    const persistenceError = new Error('version persistence failed')
    repository.findById.mockResolvedValue(formalization)
    documentPackagesRepository.findByContext.mockResolvedValue({
      id: 'package-id',
      context: { type: 'formalization', formalizationId: formalization.id },
      documents: [],
      createdAt,
      updatedAt: createdAt,
    })
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      {
        id: 'package-document-id',
        documentPackageId: 'package-id',
        documentId: document.id,
        documentSpecificationId: 'specification-id',
        createdAt,
        updatedAt: createdAt,
      },
    ])
    documentsRepository.findById.mockResolvedValue(document)
    versionsRepository.findById.mockResolvedValue(sourceVersion)
    versionsRepository.findLatestByDocumentId.mockResolvedValue(sourceVersion)
    documentFileExporter.export.mockResolvedValue({
      content: new Uint8Array([1]),
      contentType: 'application/docx',
      extension: 'docx',
    })
    fileStorageProvider.save.mockResolvedValue(storedFile)
    idProvider.generate.mockReturnValue('new-version-id')
    datetimeProvider.now.mockReturnValue(createdAt)
    versionsRepository.add.mockRejectedValue(persistenceError)

    await expect(
      new SaveManualFormalizationDocumentVersionUseCase(
        repository,
        documentPackagesRepository,
        packageDocumentsRepository,
        documentsRepository,
        versionsRepository,
        documentFileExporter,
        fileStorageProvider,
        datetimeProvider,
        idProvider,
      ).execute({
        formalizationId: formalization.id,
        documentId: document.id,
        sourceDocumentVersionId: sourceVersion.id,
        actorId: formalization.assignedLawyerId,
        content: { type: 'doc' },
      }),
    ).rejects.toBe(persistenceError)
    expect(fileStorageProvider.remove).toHaveBeenCalledWith(storedFile.id)
  })
})
