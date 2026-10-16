import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { LegalCasesRepository } from '../../../case-management/interfaces/legal-cases-repository'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentVersionHomologationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../interfaces'
import { ListCaseDocumentsUseCase } from '../list-case-documents-use-case'

describe('List Case Documents Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let access: MockProxy<CaseAccessProvider>
  let packages: MockProxy<DocumentPackagesRepository>
  let packageDocuments: MockProxy<PackageDocumentsRepository>
  let documents: MockProxy<DocumentsRepository>
  let versions: MockProxy<DocumentVersionsRepository>
  let generations: MockProxy<DocumentGenerationsRepository>
  let homologations: MockProxy<DocumentVersionHomologationsRepository>
  let useCase: ListCaseDocumentsUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    access = mock<CaseAccessProvider>()
    packages = mock<DocumentPackagesRepository>()
    packageDocuments = mock<PackageDocumentsRepository>()
    documents = mock<DocumentsRepository>()
    versions = mock<DocumentVersionsRepository>()
    generations = mock<DocumentGenerationsRepository>()
    homologations = mock<DocumentVersionHomologationsRepository>()
    useCase = new ListCaseDocumentsUseCase(
      cases,
      access,
      packages,
      packageDocuments,
      documents,
      versions,
      generations,
      homologations,
    )
  })

  it('authorizes the Case before querying its document projections', async () => {
    cases.findById.mockResolvedValue(undefined)

    const result = await useCase.execute({ caseId: 'case-1', actorId: 'collaborator-1' })

    expect(result).toEqual([])
    expect(access.authorize).toHaveBeenCalledWith({
      caseId: 'case-1',
      actorId: 'collaborator-1',
      intent: 'read_document',
    })
    expect(access.authorize.mock.invocationCallOrder[0]).toBeLessThan(
      cases.findById.mock.invocationCallOrder[0],
    )
    expect(packages.findByContext).not.toHaveBeenCalled()
  })

  it('exposes homologated versions in the case projection', async () => {
    cases.findById.mockResolvedValue({ id: 'case-1' } as any)
    packages.findByContext.mockResolvedValue({ id: 'package-1' } as any)
    packageDocuments.findByDocumentPackageId.mockResolvedValue([
      { documentId: 'document-1' },
    ] as any)
    documents.findByIds.mockResolvedValue([{ id: 'document-1' }] as any)
    versions.findByDocumentIds.mockResolvedValue([
      { id: 'version-1', documentId: 'document-1' },
      { id: 'version-2', documentId: 'document-1' },
    ] as any)
    generations.findLatestByDocumentIds.mockResolvedValue([])
    homologations.findByDocumentVersionId.mockImplementation(async (versionId) =>
      versionId === 'version-1'
        ? ({ id: 'homologation-1', artifactStoragePath: 'final/version-1.pdf' } as any)
        : undefined,
    )

    const result = await useCase.execute({ caseId: 'case-1', actorId: 'collaborator-1' })

    expect(result[0]?.versions).toEqual([
      expect.objectContaining({ id: 'version-1', homologated: true }),
      expect.objectContaining({ id: 'version-2', homologated: false }),
    ])
  })
})
