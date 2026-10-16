import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentFaker, DocumentVersionFaker } from '../../domain/entities/fakers'
import type { DocumentVersionHomologation } from '../../domain/entities'
import type {
  DocumentVersionHomologationsRepository,
  DocumentFileExporter,
  DocumentVersionsRepository,
  DocumentsRepository,
} from '../../interfaces'
import type { DatetimeProvider, FileStorageProvider } from '../../../shared/interfaces'
import { GenerateFinalDocumentArtifactUseCase } from '../generate-final-document-artifact-use-case'

describe('Generate Final Document Artifact Use Case', () => {
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let documentsRepository: MockProxy<DocumentsRepository>
  let homologationsRepository: MockProxy<DocumentVersionHomologationsRepository>
  let documentFileExporter: MockProxy<DocumentFileExporter>
  let fileStorageProvider: MockProxy<FileStorageProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: GenerateFinalDocumentArtifactUseCase

  beforeEach(() => {
    versionsRepository = mock<DocumentVersionsRepository>()
    documentsRepository = mock<DocumentsRepository>()
    homologationsRepository = mock<DocumentVersionHomologationsRepository>()
    documentFileExporter = mock<DocumentFileExporter>()
    fileStorageProvider = mock<FileStorageProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    useCase = new GenerateFinalDocumentArtifactUseCase(
      versionsRepository,
      documentsRepository,
      homologationsRepository,
      documentFileExporter,
      fileStorageProvider,
      datetimeProvider,
    )
  })

  it('exports and attaches the final artifact to an existing homologation', async () => {
    const version = DocumentVersionFaker.fake({
      documentId: 'document-id',
      status: 'approved',
    })
    const document = DocumentFaker.fake({ id: 'document-id', title: 'Procuração' })
    const homologation = {
      id: 'homologation-id',
      caseId: 'case-id',
      documentId: 'document-id',
      documentVersionId: version.id,
      approvedByCollaboratorId: 'collaborator-id',
      approvedByCollaboratorName: 'Dra. Teste',
      approvedByCollaboratorProfile: 'lawyer',
      approvedAt: new Date(),
    } as DocumentVersionHomologation
    const exportedFile = {
      content: new Uint8Array([1, 2, 3]),
      contentType: 'application/pdf',
      extension: 'pdf',
    }
    const storedFile = {
      id: 'file-id',
      filePath:
        'document-production/documents/document-id/final/version-id/procuracao-final.pdf',
      fileName: 'procuracao-final.pdf',
      contentType: 'application/pdf',
      sizeInBytes: 3,
      createdAt: new Date(),
    }
    const artifactCreatedAt = new Date('2026-10-15T12:00:00.000Z')

    ;(homologationsRepository.findByDocumentVersionId as any).mockResolvedValue(
      homologation,
    )
    ;(versionsRepository.findById as any).mockResolvedValue(version)
    ;(documentsRepository.findById as any).mockResolvedValue(document)
    ;(documentFileExporter.export as any).mockResolvedValue(exportedFile)
    ;(fileStorageProvider.save as any).mockResolvedValue(storedFile)
    ;(datetimeProvider.now as any).mockReturnValue(artifactCreatedAt)
    ;(homologationsRepository.attachArtifact as any).mockResolvedValue({
      ...homologation,
      artifactFileId: storedFile.id,
      artifactStoragePath: storedFile.filePath,
      artifactContentType: storedFile.contentType,
      artifactCreatedAt,
    })

    await expect(
      useCase.execute({ documentVersionId: version.id }),
    ).resolves.toMatchObject({
      artifactFileId: storedFile.id,
      artifactStoragePath: storedFile.filePath,
    })
    expect(documentFileExporter.export).toHaveBeenCalledWith({
      title: 'Procuração - versão final',
      content: version.content,
      approval: {
        approvedByName: homologation.approvedByCollaboratorName,
        approvedByProfile: homologation.approvedByCollaboratorProfile,
        approvedAt: homologation.approvedAt,
      },
    })
    expect(fileStorageProvider.save).toHaveBeenCalled()
  })
})
