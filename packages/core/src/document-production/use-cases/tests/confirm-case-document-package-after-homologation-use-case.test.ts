import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type {
  DocumentPackage,
  DocumentVersion,
  PackageDocument,
} from '../../domain/entities'
import type {
  DocumentPackagesRepository,
  DocumentVersionHomologationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../interfaces'
import type { DatetimeProvider } from '#shared/interfaces'
import { ConfirmCaseDocumentPackageAfterHomologationUseCase } from '../confirm-case-document-package-after-homologation-use-case'

describe('ConfirmCaseDocumentPackageAfterHomologationUseCase', () => {
  let packagesRepository: MockProxy<DocumentPackagesRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let versionsRepository: MockProxy<DocumentVersionsRepository>
  let homologationsRepository: MockProxy<DocumentVersionHomologationsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: ConfirmCaseDocumentPackageAfterHomologationUseCase

  beforeEach(() => {
    packagesRepository = mock<DocumentPackagesRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    versionsRepository = mock<DocumentVersionsRepository>()
    homologationsRepository = mock<DocumentVersionHomologationsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    ;(datetimeProvider.now as any).mockReturnValue(new Date('2026-10-15T12:00:00.000Z'))
    useCase = new ConfirmCaseDocumentPackageAfterHomologationUseCase(
      packagesRepository,
      packageDocumentsRepository,
      versionsRepository,
      homologationsRepository,
      datetimeProvider,
    )
  })

  it('confirms the case package when every latest version is approved and homologated', async () => {
    const documentPackage = packageFixture()
    const packageDocuments = [
      packageDocumentFixture('document-1'),
      packageDocumentFixture('document-2'),
    ]
    const versions = [
      versionFixture('version-1', 'document-1', 2),
      versionFixture('version-2', 'document-2', 1),
    ]
    ;(packagesRepository.findByContext as any).mockResolvedValue(documentPackage)
    ;(packageDocumentsRepository.findByDocumentPackageId as any).mockResolvedValue(
      packageDocuments,
    )
    ;(versionsRepository.findByDocumentIds as any).mockResolvedValue(versions)
    ;(homologationsRepository.findByDocumentVersionId as any).mockResolvedValue({
      caseId: 'case-id',
    } as never)
    ;(packagesRepository.confirm as any).mockResolvedValue({
      ...documentPackage,
      confirmedAt: new Date(),
    })

    await useCase.execute({
      caseId: 'case-id',
      documentVersionId: 'version-1',
      collaboratorId: 'collaborator-id',
    })

    expect(packagesRepository.confirm).toHaveBeenCalledWith(
      documentPackage.id,
      'collaborator-id',
      new Date('2026-10-15T12:00:00.000Z'),
    )
  })

  it('leaves the package open when a document is not approved or homologated', async () => {
    const documentPackage = packageFixture()
    ;(packagesRepository.findByContext as any).mockResolvedValue(documentPackage)
    ;(packageDocumentsRepository.findByDocumentPackageId as any).mockResolvedValue([
      packageDocumentFixture('document-1'),
      packageDocumentFixture('document-2'),
    ])
    ;(versionsRepository.findByDocumentIds as any).mockResolvedValue([
      versionFixture('version-1', 'document-1', 1),
      { ...versionFixture('version-2', 'document-2', 1), status: 'in_review' },
    ])
    ;(homologationsRepository.findByDocumentVersionId as any).mockResolvedValue({
      caseId: 'case-id',
    } as never)

    await useCase.execute({
      caseId: 'case-id',
      documentVersionId: 'version-1',
      collaboratorId: 'collaborator-id',
    })

    expect(packagesRepository.confirm).not.toHaveBeenCalled()
  })

  it('does not confirm an already confirmed package', async () => {
    const documentPackage = { ...packageFixture(), confirmedAt: new Date() }
    ;(packagesRepository.findByContext as any).mockResolvedValue(documentPackage)
    ;(homologationsRepository.findByDocumentVersionId as any).mockResolvedValue({
      caseId: 'case-id',
    } as never)

    await expect(
      useCase.execute({
        caseId: 'case-id',
        documentVersionId: 'version-1',
        collaboratorId: 'collaborator-id',
      }),
    ).resolves.toEqual(documentPackage)
    expect(packagesRepository.confirm).not.toHaveBeenCalled()
  })
})

function packageFixture(): DocumentPackage {
  const now = new Date()
  return {
    id: 'package-id',
    context: { type: 'case', caseId: 'case-id' },
    documents: [],
    createdAt: now,
    updatedAt: now,
  }
}

function packageDocumentFixture(documentId: string): PackageDocument {
  const now = new Date()
  return {
    id: `package-document-${documentId}`,
    documentPackageId: 'package-id',
    documentId,
    documentSpecificationId: `specification-${documentId}`,
    createdAt: now,
    updatedAt: now,
  }
}

function versionFixture(
  id: string,
  documentId: string,
  versionNumber: number,
): DocumentVersion {
  return {
    id,
    documentId,
    fileId: `file-${id}`,
    versionNumber,
    source: 'manual',
    content: { type: 'doc', content: [] },
    pendingMarkers: [],
    createdByCollaboratorId: 'collaborator-id',
    createdAt: new Date(),
    status: 'approved',
  }
}
