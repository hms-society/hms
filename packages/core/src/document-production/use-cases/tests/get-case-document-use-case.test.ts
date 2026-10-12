import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { ListCaseDocumentsUseCase } from '../list-case-documents-use-case'
import { GetCaseDocumentUseCase } from '../get-case-document-use-case'
import { NotFoundError } from '../../../shared/domain/errors/not-found-error'

describe('GetCaseDocumentUseCase', () => {
  it('returns the matching document from the authorized case projection', async () => {
    const listCaseDocuments = mock<ListCaseDocumentsUseCase>()
    const match = { document: { id: 'document-1' }, versions: [] }
    listCaseDocuments.execute.mockResolvedValue([match] as never)
    const useCase = new GetCaseDocumentUseCase(listCaseDocuments)
    const request = {
      caseId: 'case-1',
      documentId: 'document-1',
      actorId: 'collaborator-1',
    }

    await expect(useCase.execute(request)).resolves.toBe(match)
    expect(listCaseDocuments.execute).toHaveBeenCalledWith(request)
  })

  it('returns a safe not found for an unknown document in the Case', async () => {
    const listCaseDocuments: MockProxy<ListCaseDocumentsUseCase> =
      mock<ListCaseDocumentsUseCase>()
    listCaseDocuments.execute.mockResolvedValue([])
    const useCase = new GetCaseDocumentUseCase(listCaseDocuments)

    await expect(
      useCase.execute({
        caseId: 'case-1',
        documentId: 'missing-document',
        actorId: 'collaborator-1',
      }),
    ).rejects.toThrow(NotFoundError)
  })
})
