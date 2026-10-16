import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DocumentFaker,
  DocumentPackageFaker,
  DocumentVersionFaker,
  PackageDocumentFaker,
} from '@hms/core/document-production/domain/entities/fakers'
import { LegalCaseFaker } from '@hms/core/case-management/domain/entities/fakers'
import { HomologateCaseDocumentVersionController } from '@/document-production/rest/controllers/homologate-case-document-version.controller'

describe('Homologate Case Document Version Controller', () => {
  let versionsRepository: any
  let homologationsRepository: any
  let legalCasesRepository: any
  let caseMembersRepository: any
  let documentsRepository: any
  let documentPackagesRepository: any
  let packageDocumentsRepository: any
  let specificationsRepository: any
  let frozenPdfsRepository: any
  let documentPdfConverter: any
  let documentPdfInspector: any
  let idProvider: any
  let documentFileExporter: any
  let fileStorageProvider: any
  let datetimeProvider: any
  let auditEventWriter: any
  let controller: HomologateCaseDocumentVersionController

  beforeEach(() => {
    versionsRepository = {
      findById: vi.fn(),
      findByDocumentIds: vi.fn(),
    }
    homologationsRepository = {
      findByDocumentVersionId: vi.fn(),
      add: vi.fn(),
      attachArtifact: vi.fn(),
      remove: vi.fn().mockResolvedValue(undefined),
    }
    legalCasesRepository = { findById: vi.fn() }
    caseMembersRepository = { findActiveCollaboratorIdsByCaseId: vi.fn() }
    documentsRepository = { findById: vi.fn() }
    documentPackagesRepository = {
      findByContext: vi.fn(),
      confirm: vi.fn(),
      reopen: vi.fn(),
    }
    packageDocumentsRepository = { findByDocumentPackageId: vi.fn() }
    specificationsRepository = { findById: vi.fn() }
    frozenPdfsRepository = { findByDocumentVersionId: vi.fn() }
    frozenPdfsRepository.findByDocumentVersionId.mockResolvedValue({ id: 'frozen-pdf' })
    documentPdfConverter = { convert: vi.fn() }
    documentPdfInspector = { inspect: vi.fn() }
    idProvider = { generate: vi.fn() }
    documentFileExporter = { export: vi.fn() }
    fileStorageProvider = { save: vi.fn(), remove: vi.fn() }
    datetimeProvider = { now: vi.fn() }
    auditEventWriter = { add: vi.fn() }
    controller = new HomologateCaseDocumentVersionController(
      versionsRepository,
      homologationsRepository,
      legalCasesRepository,
      caseMembersRepository,
      documentsRepository,
      documentFileExporter,
      fileStorageProvider,
      documentPackagesRepository,
      packageDocumentsRepository,
      specificationsRepository,
      datetimeProvider,
      auditEventWriter,
      frozenPdfsRepository,
      documentPdfConverter,
      documentPdfInspector,
      idProvider,
    )
  })

  it('completes homologation and returns the artifact and package', async () => {
    const caseId = '10000000-0000-4000-8000-000000000001'
    const documentId = '20000000-0000-4000-8000-000000000001'
    const collaboratorId = '30000000-0000-4000-8000-000000000001'
    const version = DocumentVersionFaker.fake({
      id: '40000000-0000-4000-8000-000000000001',
      documentId,
      status: 'approved',
    })
    const legalCase = LegalCaseFaker.fake({ id: caseId })
    const document = DocumentFaker.fake({ id: documentId })
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'case', caseId },
      documents: [PackageDocumentFaker.fake({ documentId })],
    })
    const approvedAt = new Date('2026-10-16T15:00:00.000Z')
    let savedHomologation: any

    versionsRepository.findById.mockResolvedValue(version)
    versionsRepository.findByDocumentIds.mockResolvedValue([version])
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      collaboratorId,
    ])
    documentsRepository.findById.mockResolvedValue(document)
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    packageDocumentsRepository.findByDocumentPackageId.mockResolvedValue(
      documentPackage.documents,
    )
    documentPackagesRepository.confirm.mockResolvedValue({
      ...documentPackage,
      confirmedAt: approvedAt,
      confirmedByCollaboratorId: collaboratorId,
    })
    datetimeProvider.now.mockReturnValue(approvedAt)
    homologationsRepository.findByDocumentVersionId.mockImplementation(
      async () => savedHomologation,
    )
    homologationsRepository.add.mockImplementation(async (input) => {
      savedHomologation = { id: 'homologation-id', ...input }
      return savedHomologation
    })
    homologationsRepository.attachArtifact.mockImplementation(async (_id, artifact) => ({
      ...savedHomologation,
      artifactFileId: artifact.fileId,
      artifactStoragePath: artifact.storagePath,
      artifactContentType: artifact.contentType,
      artifactCreatedAt: artifact.createdAt,
    }))
    documentFileExporter.export.mockResolvedValue({
      content: new Uint8Array([1]),
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    })
    fileStorageProvider.save.mockResolvedValue({
      id: 'file-id',
      filePath: 'final/document.docx',
      fileName: 'document.docx',
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeInBytes: 1,
      createdAt: approvedAt,
    })

    const response = await controller.handle(caseId, documentId, version.id, {
      collaboratorId,
      professionalName: 'Dra. Teste',
      profile: 'lawyer',
    } as any)

    expect(response.homologation).toMatchObject({ artifactFileId: 'file-id' })
    expect(response.documentPackage).toMatchObject({
      confirmedByCollaboratorId: collaboratorId,
    })
    expect(auditEventWriter.add).toHaveBeenCalled()
  })

  it('removes the partial homologation when artifact generation fails', async () => {
    const caseId = '10000000-0000-4000-8000-000000000002'
    const documentId = '20000000-0000-4000-8000-000000000002'
    const collaboratorId = '30000000-0000-4000-8000-000000000002'
    const version = DocumentVersionFaker.fake({
      id: '40000000-0000-4000-8000-000000000002',
      documentId,
      status: 'approved',
    })
    const legalCase = LegalCaseFaker.fake({ id: caseId })
    const document = DocumentFaker.fake({ id: documentId })
    const documentPackage = DocumentPackageFaker.fake({
      context: { type: 'case', caseId },
      documents: [PackageDocumentFaker.fake({ documentId })],
    })
    const homologation = {
      id: 'homologation-id',
      caseId,
      documentId,
      documentVersionId: version.id,
      approvedByCollaboratorId: collaboratorId,
      approvedByCollaboratorName: 'Dra. Teste',
      approvedByCollaboratorProfile: 'lawyer',
      approvedAt: new Date('2026-10-16T15:00:00.000Z'),
    }
    let homologationPersisted = false

    versionsRepository.findById.mockResolvedValue(version)
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      collaboratorId,
    ])
    documentPackagesRepository.findByContext.mockResolvedValue(documentPackage)
    homologationsRepository.findByDocumentVersionId.mockImplementation(async () =>
      homologationPersisted ? homologation : undefined,
    )
    homologationsRepository.add.mockImplementation(async () => {
      homologationPersisted = true
      return homologation
    })
    documentsRepository.findById.mockResolvedValue(document)
    documentFileExporter.export.mockRejectedValue(new Error('export failed'))

    await expect(
      controller.handle(caseId, documentId, version.id, {
        collaboratorId,
        professionalName: 'Dra. Teste',
        profile: 'lawyer',
      } as any),
    ).rejects.toThrow('export failed')

    expect(homologationsRepository.remove).toHaveBeenCalledWith(homologation.id)
    expect(documentPackagesRepository.confirm).not.toHaveBeenCalled()
    expect(auditEventWriter.add).not.toHaveBeenCalled()
  })
})
