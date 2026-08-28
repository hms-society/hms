import {
  DocumentFaker,
  DocumentVersionFaker,
} from '../../../document-production/domain/entities/fakers'
import type { DocumentTemplateContent } from '../../../document-production/domain/structures'
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
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ConsultationFaker } from '../../domain/entities/fakers'
import type { ConsultationsRepository } from '../../interfaces'
import { SaveManualConsultationDocumentVersionUseCase } from '../save-manual-consultation-document-version-use-case'

describe('Save Manual Consultation Document Version Use Case', () => {
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let documentsRepository: MockProxy<DocumentsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let documentFileExporter: MockProxy<DocumentFileExporter>
  let fileStorageProvider: MockProxy<FileStorageProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let idProvider: MockProxy<IdProvider>
  let useCase: SaveManualConsultationDocumentVersionUseCase

  beforeEach(() => {
    consultationsRepository = mock<ConsultationsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    documentsRepository = mock<DocumentsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
    documentFileExporter = mock<DocumentFileExporter>()
    fileStorageProvider = mock<FileStorageProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    idProvider = mock<IdProvider>()
    useCase = new SaveManualConsultationDocumentVersionUseCase(
      consultationsRepository,
      documentPackagesRepository,
      packageDocumentsRepository,
      documentsRepository,
      versionsRepository,
      documentFileExporter,
      fileStorageProvider,
      datetimeProvider,
      idProvider,
    )
  })

  it('allows an administrator to save a manual version in any consultation', async () => {
    const consultation = ConsultationFaker.fake()
    const document = DocumentFaker.fake()
    const sourceVersion = DocumentVersionFaker.fake({ documentId: document.id })
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Cliente: {cliente_nome}' }],
        },
      ],
    } as unknown as DocumentTemplateContent
    const versionId = '2f952206-5e7d-4930-bd46-e55cded671fc'
    const createdAt = new Date('2026-08-12T19:00:00.000Z')
    consultationsRepository.findById.mockResolvedValue(consultation)
    documentPackagesRepository.findByContext.mockResolvedValue({
      id: '11c8ee44-962c-4975-a1f4-fb0f28cdf889',
      context: { type: 'consultation', consultationId: consultation.id },
      documents: [],
      createdAt,
      updatedAt: createdAt,
    })
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue([
      {
        id: '01f9b31d-4bfa-49fc-8e39-337f5c82325f',
        documentPackageId: '11c8ee44-962c-4975-a1f4-fb0f28cdf889',
        documentId: document.id,
        documentSpecificationId: 'f7471138-f86c-49db-952e-5e21dd65d3fd',
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
    fileStorageProvider.save.mockResolvedValue({
      id: 'ffad337e-2cf7-4d25-9b81-ff3f4e520741',
      filePath: 'document.docx',
      fileName: 'document.docx',
      contentType: 'application/docx',
      sizeInBytes: 1,
      createdAt,
    })
    idProvider.generate.mockReturnValue(versionId)
    datetimeProvider.now.mockReturnValue(createdAt)
    const saved = DocumentVersionFaker.fake({
      id: versionId,
      documentId: document.id,
      sourceDocumentVersionId: sourceVersion.id,
      versionNumber: 2,
      source: 'manual',
      content,
      pendingMarkers: [{ marker: '{cliente_nome}' }],
      createdAt,
    })
    versionsRepository.add.mockResolvedValue(saved)

    await expect(
      useCase.execute({
        consultationId: consultation.id,
        documentId: document.id,
        sourceDocumentVersionId: sourceVersion.id,
        createdByCollaboratorId: 'admin-collaborator-id',
        createdByCollaboratorProfile: 'admin',
        content,
      }),
    ).resolves.toEqual(saved)
    expect(versionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: versionId,
        sourceDocumentVersionId: sourceVersion.id,
        pendingMarkers: [{ marker: '{cliente_nome}' }],
        source: 'manual',
        status: 'in_review',
      }),
    )
  })

  it('removes the stored file when version persistence fails', async () => {
    const consultation = ConsultationFaker.fake()
    const document = DocumentFaker.fake()
    const sourceVersion = DocumentVersionFaker.fake({ documentId: document.id })
    const createdAt = new Date('2026-08-12T19:00:00.000Z')
    const storedFile = {
      id: 'stored-file-id',
      filePath: 'document.docx',
      fileName: 'document.docx',
      contentType: 'application/docx',
      sizeInBytes: 1,
      createdAt,
    }
    const persistenceError = new Error('version persistence failed')
    consultationsRepository.findById.mockResolvedValue(consultation)
    documentPackagesRepository.findByContext.mockResolvedValue({
      id: 'package-id',
      context: { type: 'consultation', consultationId: consultation.id },
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
      useCase.execute({
        consultationId: consultation.id,
        documentId: document.id,
        sourceDocumentVersionId: sourceVersion.id,
        createdByCollaboratorId: 'admin-collaborator-id',
        createdByCollaboratorProfile: 'admin',
        content: { type: 'doc' },
      }),
    ).rejects.toBe(persistenceError)
    expect(fileStorageProvider.remove).toHaveBeenCalledWith(storedFile.id)
  })
})
