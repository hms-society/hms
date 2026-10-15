import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { LegalCasesRepository } from '../../../case-management/interfaces/legal-cases-repository'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
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
  let useCase: ListCaseDocumentsUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    access = mock<CaseAccessProvider>()
    packages = mock<DocumentPackagesRepository>()
    packageDocuments = mock<PackageDocumentsRepository>()
    documents = mock<DocumentsRepository>()
    versions = mock<DocumentVersionsRepository>()
    generations = mock<DocumentGenerationsRepository>()
    useCase = new ListCaseDocumentsUseCase(
      cases,
      access,
      packages,
      packageDocuments,
      documents,
      versions,
      generations,
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
})
