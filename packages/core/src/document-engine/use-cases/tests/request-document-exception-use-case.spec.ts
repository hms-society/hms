import { describe, it, expect, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { RequestDocumentExceptionUseCase } from '../request-document-exception-use-case'
import type { DocumentExceptionsRepository } from '../../interfaces/document-exceptions-repository'
import type { DocumentExceptionAuditLogsRepository } from '../../interfaces/document-exception-audit-logs-repository'
import type { DocumentException } from '../../domain/entities/document-exception'
import { DocumentExceptionStatus, DocumentExceptionType } from '../../domain/structures'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'

describe('RequestDocumentExceptionUseCase', () => {
  let useCase: RequestDocumentExceptionUseCase
  let exceptionsRepositoryMock: MockProxy<DocumentExceptionsRepository>
  let auditLogsRepositoryMock: MockProxy<DocumentExceptionAuditLogsRepository>
  let caseAccessProvider: MockProxy<CaseAccessProvider>

  const mockException: DocumentException = {
    id: 'exc-123',
    documentId: 'doc-456',
    caseId: 'case-789',
    type: DocumentExceptionType.ACEITE_PROVISORIO,
    status: DocumentExceptionStatus.PENDING,
    justification: 'Documento precisa de aceite provisório',
    deadlineDate: new Date('2026-09-30'),
    createdBy: 'user-001',
    reviewedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    exceptionsRepositoryMock = mock<DocumentExceptionsRepository>()
    exceptionsRepositoryMock.create.mockResolvedValue(mockException)

    auditLogsRepositoryMock = mock<DocumentExceptionAuditLogsRepository>()
    auditLogsRepositoryMock.create.mockResolvedValue(undefined)
    caseAccessProvider = mock<CaseAccessProvider>()

    useCase = new RequestDocumentExceptionUseCase(
      exceptionsRepositoryMock,
      auditLogsRepositoryMock,
      caseAccessProvider,
    )
  })

  it('deve criar exceção do tipo ACEITE_PROVISORIO com sucesso', async () => {
    const result = await useCase.execute({
      documentId: 'doc-456',
      caseId: 'case-789',
      type: DocumentExceptionType.ACEITE_PROVISORIO,
      justification: 'Documento precisa de aceite provisório',
      deadlineDate: new Date('2026-09-30'),
      actorId: 'user-001',
    })

    expect(result).toEqual(mockException)
    expect(caseAccessProvider.authorize).toHaveBeenCalledWith({
      caseId: 'case-789',
      actorId: 'user-001',
      intent: 'manage_document_exception',
    })
    expect(exceptionsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'doc-456',
        caseId: 'case-789',
        type: DocumentExceptionType.ACEITE_PROVISORIO,
        status: DocumentExceptionStatus.PENDING,
        createdBy: 'user-001',
      }),
    )
    expect(auditLogsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        documentExceptionId: 'exc-123',
        action: 'REQUESTED',
        userId: 'user-001',
      }),
    )
  })

  it('deve criar exceção do tipo DISPENSA_DEFINITIVA sem deadlineDate', async () => {
    const mockDispensa: DocumentException = {
      ...mockException,
      type: DocumentExceptionType.DISPENSA_DEFINITIVA,
      deadlineDate: null,
    }
    exceptionsRepositoryMock.create.mockResolvedValueOnce(mockDispensa)

    const result = await useCase.execute({
      documentId: 'doc-456',
      caseId: 'case-789',
      type: DocumentExceptionType.DISPENSA_DEFINITIVA,
      justification: 'Documento dispensado definitivamente por motivo legal',
      actorId: 'user-001',
    })

    expect(result.type).toBe(DocumentExceptionType.DISPENSA_DEFINITIVA)
    expect(exceptionsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ deadlineDate: null }),
    )
  })

  it('deve lançar erro se ACEITE_PROVISORIO não tiver deadlineDate', async () => {
    await expect(
      useCase.execute({
        documentId: 'doc-456',
        caseId: 'case-789',
        type: DocumentExceptionType.ACEITE_PROVISORIO,
        justification: 'Faltou a data limite',
        actorId: 'user-001',
      }),
    ).rejects.toThrow('Data limite é obrigatória para Aceite Provisório')
  })

  it('deve lançar erro se o tipo for inválido', async () => {
    await expect(
      useCase.execute({
        documentId: 'doc-456',
        caseId: 'case-789',
        type: 'TIPO_INVALIDO',
        justification: 'Alguma justificativa',
        actorId: 'user-001',
      }),
    ).rejects.toThrow('Tipo de exceção inválido')
  })

  it('deve lançar erro se parâmetros obrigatórios estiverem ausentes', async () => {
    await expect(
      useCase.execute({
        caseId: '',
        type: DocumentExceptionType.ACEITE_PROVISORIO,
        justification: 'Alguma justificativa',
        actorId: 'user-001',
      }),
    ).rejects.toThrow('Parâmetros obrigatórios ausentes')
  })
})
