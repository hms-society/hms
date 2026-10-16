import { describe, it, expect, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { GetCaseDocumentExceptionsUseCase } from '../get-case-document-exceptions-use-case'
import type { DocumentExceptionsRepository } from '../../interfaces/document-exceptions-repository'
import type { DocumentException } from '../../domain/entities/document-exception'
import { DocumentExceptionStatus, DocumentExceptionType } from '../../domain/structures'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'

describe('GetCaseDocumentExceptionsUseCase', () => {
  let useCase: GetCaseDocumentExceptionsUseCase
  let exceptionsRepositoryMock: MockProxy<DocumentExceptionsRepository>
  let caseAccessProvider: MockProxy<CaseAccessProvider>

  const mockExceptions: DocumentException[] = [
    {
      id: 'exc-123',
      documentId: 'doc-456',
      caseId: 'case-789',
      type: DocumentExceptionType.ACEITE_PROVISORIO,
      status: DocumentExceptionStatus.PENDING,
      justification: 'Falta doc',
      deadlineDate: new Date(),
      createdBy: 'user-1',
      reviewedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(() => {
    exceptionsRepositoryMock = mock<DocumentExceptionsRepository>()
    exceptionsRepositoryMock.findByCaseId.mockResolvedValue(mockExceptions)
    caseAccessProvider = mock<CaseAccessProvider>()

    useCase = new GetCaseDocumentExceptionsUseCase(
      exceptionsRepositoryMock,
      caseAccessProvider,
    )
  })

  it('deve retornar exceções com sucesso', async () => {
    const result = await useCase.execute({ caseId: 'case-789', actorId: 'actor-1' })

    expect(result).toEqual(mockExceptions)
    expect(exceptionsRepositoryMock.findByCaseId).toHaveBeenCalledWith('case-789')
    expect(caseAccessProvider.authorize).toHaveBeenCalledWith({
      caseId: 'case-789',
      actorId: 'actor-1',
      intent: 'read_document',
    })
  })

  it('deve lançar erro se caseId não for informado', async () => {
    await expect(useCase.execute({ caseId: '', actorId: 'actor-1' })).rejects.toThrow(
      'O ID do caso é obrigatório',
    )
  })
})
