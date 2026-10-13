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
import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import { LegalCaseStatus } from '../../domain/structures'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CaseAccessProvider, LegalCasesRepository } from '../../interfaces'
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
  let access: MockProxy<CaseAccessProvider>
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
    access = mock<CaseAccessProvider>()
    access.authorize.mockResolvedValue()
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
      access,
    )
  })

  it('persists a new immutable manual version linked to the version being edited', async () => {
    const legalCase = LegalCaseFaker.fake()
    const document = DocumentFaker.fake()
    const sourceVersion = DocumentVersionFaker.fake({
      id: 'source-version',
      documentId: document.id,
      status: 'approved',
      content: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Versão original.' }] },
        ],
      } as unknown as DocumentTemplateContent,
    })
    const sourceSnapshot = structuredClone(sourceVersion)
    const createdAt = new Date('2026-09-25T15:00:00.000Z')
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Requerimento de {cliente_nome}.' }],
        },
      ],
    } as unknown as DocumentTemplateContent
    cases.findById.mockResolvedValue(legalCase)
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
      status: 'draft',
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
        status: 'draft',
      }),
    )
    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: expect.stringContaining('/manual/new-version-id/'),
      }),
    )
    expect(sourceVersion).toEqual(sourceSnapshot)
    expect(versions.add).toHaveBeenCalledTimes(1)
    expect(versions.add).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: document.id,
        sourceDocumentVersionId: sourceVersion.id,
        content,
        pendingMarkers: [{ marker: '{cliente_nome}' }],
        status: 'draft',
      }),
    )
  })

  it('rejects a version authored by a different document', async () => {
    const legalCase = LegalCaseFaker.fake()
    const document = DocumentFaker.fake()
    cases.findById.mockResolvedValue(legalCase)
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

  it('denies Admin manual saves before package or storage side effects', async () => {
    const legalCase = LegalCaseFaker.fake()
    cases.findById.mockResolvedValue(legalCase)
    access.authorize.mockRejectedValue(
      new ForbiddenError('Acesso jurídico ao Caso não autorizado.'),
    )

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: 'document-id',
        sourceDocumentVersionId: 'source-version-id',
        createdByCollaboratorId: 'admin-id',
        createdByCollaboratorProfile: CollaboratorProfile.Admin,
        content: { type: 'doc' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)

    expect(access.authorize).toHaveBeenCalledWith({
      caseId: legalCase.id,
      actorId: 'admin-id',
      intent: 'write_content',
    })
    expect(cases.listByTeamMember).not.toHaveBeenCalled()
    expect(packages.findByContext).not.toHaveBeenCalled()
    expect(exporter.export).not.toHaveBeenCalled()
    expect(storage.save).not.toHaveBeenCalled()
    expect(versions.add).not.toHaveBeenCalled()
  })

  it('rejects Closed cases before access, export, storage, or version writes', async () => {
    const legalCase = LegalCaseFaker.fake({ status: LegalCaseStatus.Closed })
    cases.findById.mockResolvedValue(legalCase)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: 'document-id',
        sourceDocumentVersionId: 'source-version-id',
        createdByCollaboratorId: 'lawyer-id',
        createdByCollaboratorProfile: CollaboratorProfile.Lawyer,
        content: { type: 'doc' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)

    expect(access.authorize).not.toHaveBeenCalled()
    expect(packages.findByContext).not.toHaveBeenCalled()
    expect(packageDocuments.findByDocumentPackageId).not.toHaveBeenCalled()
    expect(documents.findById).not.toHaveBeenCalled()
    expect(exporter.export).not.toHaveBeenCalled()
    expect(storage.save).not.toHaveBeenCalled()
    expect(versions.add).not.toHaveBeenCalled()
  })

  it('rejects missing package links and source versions that do not belong to the document', async () => {
    const legalCase = LegalCaseFaker.fake()
    const document = DocumentFaker.fake()
    const sourceVersion = DocumentVersionFaker.fake({
      id: 'source-version',
      documentId: document.id,
    })
    const request = {
      caseId: legalCase.id,
      documentId: document.id,
      sourceDocumentVersionId: sourceVersion.id,
      createdByCollaboratorId: 'author-id',
      createdByCollaboratorProfile: CollaboratorProfile.Lawyer,
      content: { type: 'doc' } as DocumentTemplateContent,
    }
    cases.findById.mockResolvedValue(legalCase)

    packages.findByContext.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()

    packages.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocuments.findByDocumentPackageId.mockResolvedValue([])
    await expect(useCase.execute(request)).rejects.toThrow()

    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      { documentId: document.id } as never,
    ])
    documents.findById.mockResolvedValue(undefined)
    versions.findById.mockResolvedValue(sourceVersion)
    await expect(useCase.execute(request)).rejects.toThrow('não pertence a esta peça')

    documents.findById.mockResolvedValue(document)
    versions.findById.mockResolvedValue({
      ...sourceVersion,
      documentId: 'another-document',
    })
    await expect(useCase.execute(request)).rejects.toThrow('não pertence a esta peça')

    versions.findById.mockResolvedValue(sourceVersion)
    versions.findByDocumentIds.mockResolvedValue([])
    await expect(useCase.execute(request)).rejects.toThrow('não pertence a esta peça')
    expect(exporter.export).not.toHaveBeenCalled()
  })

  it('removes the exported file when storing the manual version fails', async () => {
    const legalCase = LegalCaseFaker.fake()
    const document = DocumentFaker.fake({ title: 'Ação de revisão' })
    const sourceVersion = DocumentVersionFaker.fake({
      id: 'source-version',
      documentId: document.id,
    })
    const now = new Date('2026-09-25T15:00:00.000Z')
    cases.findById.mockResolvedValue(legalCase)
    packages.findByContext.mockResolvedValue({ id: 'package-id' } as never)
    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      { documentId: document.id } as never,
    ])
    documents.findById.mockResolvedValue(document)
    versions.findById.mockResolvedValue(sourceVersion)
    versions.findByDocumentIds.mockResolvedValue([sourceVersion])
    versions.findLatestByDocumentId.mockResolvedValue(undefined)
    ids.generate.mockReturnValue('new-version-id')
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
      createdAt: now,
    })
    versions.add.mockRejectedValue(new Error('database write failed'))

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentId: document.id,
        sourceDocumentVersionId: sourceVersion.id,
        createdByCollaboratorId: 'author-id',
        createdByCollaboratorProfile: CollaboratorProfile.Lawyer,
        content: { type: 'doc' } as DocumentTemplateContent,
      }),
    ).rejects.toThrow('database write failed')
    expect(storage.remove).toHaveBeenCalledWith('file-id')
  })
})
