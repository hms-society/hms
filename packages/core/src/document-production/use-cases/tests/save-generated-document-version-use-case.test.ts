import type { File } from '#shared/domain/entities'
import type { DatetimeProvider, FileStorageProvider } from '#shared/interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { fakeDocumentGeneration, fakeDocumentVersion } from '../../domain/entities/fakers'
import {
  DocumentGenerationConflictError,
  DocumentGenerationNotFoundError,
} from '../../domain/errors'
import type { DocumentTemplateContent } from '../../domain/structures'
import type {
  DocumentFileExporter,
  DocumentGenerationsRepository,
  DocumentVersionsRepository,
} from '../../interfaces'
import { SaveGeneratedDocumentVersionUseCase } from '../save-generated-document-version-use-case'

describe('Save Generated Document Version Use Case', () => {
  let generationsRepository: MockProxy<DocumentGenerationsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let documentFileExporter: MockProxy<DocumentFileExporter>
  let fileStorageProvider: MockProxy<FileStorageProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: SaveGeneratedDocumentVersionUseCase

  beforeEach(() => {
    generationsRepository = mock<DocumentGenerationsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
    documentFileExporter = mock<DocumentFileExporter>()
    fileStorageProvider = mock<FileStorageProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    useCase = new SaveGeneratedDocumentVersionUseCase(
      generationsRepository,
      versionsRepository,
      documentFileExporter,
      fileStorageProvider,
      datetimeProvider,
    )
  })

  it('exports, stores, and persists the next generated document version', async () => {
    const generation = fakeDocumentGeneration({
      status: 'running',
      template: {
        name: 'Procuração Jurídica',
        content: { type: 'doc' },
        variables: [],
      },
    })
    const latestVersion = fakeDocumentVersion({
      documentId: generation.documentId,
      versionNumber: 2,
    })
    const content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Texto' }] }],
    } as unknown as DocumentTemplateContent
    const pendingMarkers = [{ marker: '{client_cpf}' }]
    const bytes = new Uint8Array([1, 2, 3])
    const storedFile: File = {
      id: '90e0f45e-cfa6-41f4-a96a-cacbdcdb84b7',
      filePath: 'stored/path',
      fileName: 'stored.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeInBytes: bytes.byteLength,
      createdAt: new Date('2026-08-11T12:00:00.000Z'),
    }
    const now = new Date('2026-08-11T13:00:00.000Z')
    const savedVersion = fakeDocumentVersion({
      documentId: generation.documentId,
      fileId: storedFile.id,
      versionNumber: 3,
      content,
      pendingMarkers,
      createdByCollaboratorId: generation.requestedByCollaboratorId,
      createdAt: now,
    })
    generationsRepository.findById.mockResolvedValue(generation)
    versionsRepository.findByDocumentGenerationId.mockResolvedValue(undefined)
    versionsRepository.findLatestByDocumentId.mockResolvedValue(latestVersion)
    documentFileExporter.export.mockResolvedValue({
      content: bytes,
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    })
    fileStorageProvider.save.mockResolvedValue(storedFile)
    datetimeProvider.now.mockReturnValue(now)
    versionsRepository.add.mockResolvedValue(savedVersion)

    await expect(
      useCase.execute({
        documentGenerationId: generation.id,
        content,
        pendingMarkers,
      }),
    ).resolves.toBe(savedVersion)
    expect(documentFileExporter.export).toHaveBeenCalledWith({
      title: generation.template.name,
      content,
    })
    expect(fileStorageProvider.save).toHaveBeenCalledWith({
      filePath: `document-production/documents/${generation.documentId}/generations/${generation.id}/procuracao-juridica-v3.docx`,
      fileName: 'procuracao-juridica-v3.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeInBytes: 3,
      content: bytes,
    })
    expect(versionsRepository.add).toHaveBeenCalledWith({
      documentId: generation.documentId,
      documentGenerationId: generation.id,
      fileId: storedFile.id,
      versionNumber: 3,
      source: 'ai',
      content,
      pendingMarkers,
      createdByCollaboratorId: generation.requestedByCollaboratorId,
      createdAt: now,
    })
  })

  it('starts numbering at one when the document has no previous version', async () => {
    const generation = fakeDocumentGeneration({ status: 'running' })
    const bytes = new Uint8Array([1])
    const savedVersion = fakeDocumentVersion({
      documentId: generation.documentId,
      versionNumber: 1,
    })
    generationsRepository.findById.mockResolvedValue(generation)
    versionsRepository.findByDocumentGenerationId.mockResolvedValue(undefined)
    versionsRepository.findLatestByDocumentId.mockResolvedValue(undefined)
    documentFileExporter.export.mockResolvedValue({
      content: bytes,
      contentType: 'application/docx',
      extension: 'docx',
    })
    fileStorageProvider.save.mockResolvedValue({
      id: savedVersion.fileId,
      filePath: 'path',
      fileName: 'file.docx',
      contentType: 'application/docx',
      sizeInBytes: 1,
      createdAt: new Date(),
    })
    datetimeProvider.now.mockReturnValue(savedVersion.createdAt)
    versionsRepository.add.mockResolvedValue(savedVersion)

    await useCase.execute({
      documentGenerationId: generation.id,
      content: { type: 'doc' },
      pendingMarkers: [],
    })

    expect(versionsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ versionNumber: 1 }),
    )
  })

  it('raises a not-found error when the generation does not exist', async () => {
    generationsRepository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        documentGenerationId: 'missing-generation',
        content: { type: 'doc' },
        pendingMarkers: [],
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationNotFoundError)
    expect(documentFileExporter.export).not.toHaveBeenCalled()
  })

  it('reuses the version already created by the same generation', async () => {
    const generation = fakeDocumentGeneration({ status: 'running' })
    const existingVersion = fakeDocumentVersion({
      documentId: generation.documentId,
      documentGenerationId: generation.id,
    })
    generationsRepository.findById.mockResolvedValue(generation)
    versionsRepository.findByDocumentGenerationId.mockResolvedValue(existingVersion)

    await expect(
      useCase.execute({
        documentGenerationId: generation.id,
        content: { type: 'doc' },
        pendingMarkers: [],
      }),
    ).resolves.toBe(existingVersion)
    expect(documentFileExporter.export).not.toHaveBeenCalled()
    expect(fileStorageProvider.save).not.toHaveBeenCalled()
    expect(versionsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects a generation that is not running', async () => {
    const generation = fakeDocumentGeneration({ status: 'completed' })
    generationsRepository.findById.mockResolvedValue(generation)

    await expect(
      useCase.execute({
        documentGenerationId: generation.id,
        content: { type: 'doc' },
        pendingMarkers: [],
      }),
    ).rejects.toBeInstanceOf(DocumentGenerationConflictError)
    expect(documentFileExporter.export).not.toHaveBeenCalled()
  })
})
