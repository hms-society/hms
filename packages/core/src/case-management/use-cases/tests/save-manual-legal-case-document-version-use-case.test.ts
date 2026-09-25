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
import { CollaboratorProfile } from '../../../identity/domain/structures'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { LegalCasesRepository } from '../../interfaces'
import { SaveManualLegalCaseDocumentVersionUseCase } from '../save-manual-legal-case-document-version-use-case'

describe('SaveManualLegalCaseDocumentVersionUseCase', () => {
  let cases: MockProxy<LegalCasesRepository>
  let packages: MockProxy<DocumentPackagesRepository>
  let packageDocuments: MockProxy<PackageDocumentsRepository>
  let documents: MockProxy<DocumentsRepository>
  let versions: MockProxy<DocumentVersionsRepository>
  let exporter: MockProxy<DocumentFileExporter>
  let storage: MockProxy<FileStorageProvider>
  let datetime: MockProxy<DatetimeProvider>
  let ids: MockProxy<IdProvider>
  let useCase: SaveManualLegalCaseDocumentVersionUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    packages = mock<DocumentPackagesRepository>()
    packageDocuments = mock<PackageDocumentsRepository>()
    documents = mock<DocumentsRepository>()
    versions = mock<DocumentVersionsRepository>()
    exporter = mock<DocumentFileExporter>()
    storage = mock<FileStorageProvider>()
    datetime = mock<DatetimeProvider>()
    ids = mock<IdProvider>()
    useCase = new SaveManualLegalCaseDocumentVersionUseCase(
      cases,
      packages,
      packageDocuments,
      documents,
      versions,
      exporter,
      storage,
      datetime,
      ids,
    )
  })

  it('persists a new immutable manual version linked to the version being edited', async () => {
    const legalCase = LegalCaseFaker.fake()
    const document = DocumentFaker.fake()
    const sourceVersion = DocumentVersionFaker.fake({
      id: 'source-version',
      documentId: document.id,
    })
    const createdAt = new Date('2026-09-25T15:00:00.000Z')
    const content = { type: 'doc', content: [] } as unknown as DocumentTemplateContent
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])
    packages.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      { documentId: document.id } as never,
    ])
    documents.findById.mockResolvedValue(document)
    versions.findById.mockResolvedValue(sourceVersion)
    versions.findByDocumentIds.mockResolvedValue([sourceVersion])
    versions.findLatestByDocumentId.mockResolvedValue(sourceVersion)
    ids.generate.mockReturnValue('new-version-id')
    datetime.now.mockReturnValue(createdAt)
    exporter.export.mockResolvedValue({
      content: new Uint8Array([1]),
      contentType: 'application/docx',
      extension: 'docx',
    })
    storage.save.mockResolvedValue({
      id: 'file-id',
      filePath: 'path',
      fileName: 'file.docx',
      contentType: 'application/docx',
      sizeInBytes: 1,
      createdAt,
    })
    const savedVersion = DocumentVersionFaker.fake({
      id: 'new-version-id',
      documentId: document.id,
      sourceDocumentVersionId: sourceVersion.id,
      versionNumber: 2,
      source: 'manual',
      status: 'in_review',
    })
    versions.add.mockResolvedValue(savedVersion)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: document.id,
        sourceDocumentVersionId: sourceVersion.id,
        createdByCollaboratorId: 'author-id',
        createdByCollaboratorProfile: CollaboratorProfile.Lawyer,
        content,
      }),
    ).resolves.toBe(savedVersion)
    expect(versions.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-version-id',
        sourceDocumentVersionId: sourceVersion.id,
        versionNumber: 2,
        source: 'manual',
        status: 'in_review',
      }),
    )
    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: expect.stringContaining('/manual/new-version-id/'),
      }),
    )
  })

  it('rejects a version authored by a different document', async () => {
    const legalCase = LegalCaseFaker.fake()
    const document = DocumentFaker.fake()
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])
    packages.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      { documentId: document.id } as never,
    ])
    documents.findById.mockResolvedValue(document)
    versions.findById.mockResolvedValue(
      DocumentVersionFaker.fake({ documentId: 'other-document' }),
    )

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: document.id,
        sourceDocumentVersionId: 'wrong-version',
        createdByCollaboratorId: 'author-id',
        createdByCollaboratorProfile: CollaboratorProfile.Lawyer,
        content: { type: 'doc' },
      }),
    ).rejects.toThrow()
    expect(exporter.export).not.toHaveBeenCalled()
  })
})
