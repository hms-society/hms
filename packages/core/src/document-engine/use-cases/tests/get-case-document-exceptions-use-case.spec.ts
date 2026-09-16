import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mocked } from 'vitest'
import { GetCaseDocumentExceptionsUseCase } from '../get-case-document-exceptions-use-case'
import type { DocumentExceptionsRepository } from '../../interfaces/document-exceptions-repository'
import type { DocumentException } from '../../domain/entities/document-exception'
import { DocumentExceptionStatus, DocumentExceptionType } from '../../domain/structures'

describe('GetCaseDocumentExceptionsUseCase', () => {
  let useCase: GetCaseDocumentExceptionsUseCase
  let exceptionsRepositoryMock: Mocked<DocumentExceptionsRepository>

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
    }
  ]

  beforeEach(() => {
    exceptionsRepositoryMock = {
      create: vi.fn(),
      findById: vi.fn(),
      findByCaseId: vi.fn().mockResolvedValue(mockExceptions),
      updateStatus: vi.fn(),
      hasExpiredExceptionsForCase: vi.fn(),
      findExpiredProvisionalAcceptances: vi.fn(),
    } as unknown as Mocked<DocumentExceptionsRepository>

    useCase = new GetCaseDocumentExceptionsUseCase(exceptionsRepositoryMock)
  })

  it('deve retornar exceções com sucesso', async () => {
    const result = await useCase.execute({ caseId: 'case-789' })

    expect(result).toEqual(mockExceptions)
    expect(exceptionsRepositoryMock.findByCaseId).toHaveBeenCalledWith('case-789')
  })

  it('deve lançar erro se caseId não for informado', async () => {
    await expect(useCase.execute({ caseId: '' })).rejects.toThrow('O ID do caso é obrigatório')
  })
})
