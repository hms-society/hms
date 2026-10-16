import { describe, it, expect, beforeEach } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { ReviewDocumentExceptionUseCase } from '../review-document-exception-use-case'
import type { DocumentExceptionsRepository } from '../../interfaces/document-exceptions-repository'
import type { DocumentExceptionAuditLogsRepository } from '../../interfaces/document-exception-audit-logs-repository'
import type { DocumentException } from '../../domain/entities/document-exception'
import { DocumentExceptionStatus, DocumentExceptionType } from '../../domain/structures'
import type { CaseAccessProvider } from '../../../case-management/interfaces/case-access-provider'

describe('ReviewDocumentExceptionUseCase', () => {
  let useCase: ReviewDocumentExceptionUseCase
  let exceptionsRepositoryMock: MockProxy<DocumentExceptionsRepository>
  let auditLogsRepositoryMock: MockProxy<DocumentExceptionAuditLogsRepository>
  let caseAccessProvider: MockProxy<CaseAccessProvider>

  const mockPendingException: DocumentException = {
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
    exceptionsRepositoryMock.findById.mockResolvedValue(mockPendingException)
    exceptionsRepositoryMock.updateStatus.mockResolvedValue({
      ...mockPendingException,
      status: DocumentExceptionStatus.APPROVED,
      reviewedBy: 'supervisor-001',
    })

    auditLogsRepositoryMock = mock<DocumentExceptionAuditLogsRepository>()
    auditLogsRepositoryMock.create.mockResolvedValue(undefined)
    caseAccessProvider = mock<CaseAccessProvider>()

    useCase = new ReviewDocumentExceptionUseCase(
      exceptionsRepositoryMock,
      auditLogsRepositoryMock,
      caseAccessProvider,
    )
  })

  it('deve aprovar uma exceção pendente com sucesso', async () => {
    const result = await useCase.execute({
      documentExceptionId: 'exc-123',
      action: 'APPROVE',
      actorId: 'supervisor-001',
    })

    expect(result.status).toBe(DocumentExceptionStatus.APPROVED)
    expect(caseAccessProvider.authorize).toHaveBeenCalledWith({
      caseId: 'case-789',
      actorId: 'supervisor-001',
      intent: 'manage_document_exception',
    })
    expect(exceptionsRepositoryMock.updateStatus).toHaveBeenCalledWith(
      'exc-123',
      expect.objectContaining({
        status: DocumentExceptionStatus.APPROVED,
        reviewedBy: 'supervisor-001',
      }),
    )
    expect(auditLogsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        documentExceptionId: 'exc-123',
        action: 'APPROVED',
        userId: 'supervisor-001',
      }),
    )
  })

  it('deve rejeitar uma exceção pendente com sucesso', async () => {
    exceptionsRepositoryMock.updateStatus.mockResolvedValueOnce({
      ...mockPendingException,
      status: DocumentExceptionStatus.REJECTED,
      reviewedBy: 'supervisor-001',
    })

    const result = await useCase.execute({
      documentExceptionId: 'exc-123',
      action: 'REJECT',
      justification: 'Documento não atende aos requisitos mínimos',
      actorId: 'supervisor-001',
    })

    expect(result.status).toBe(DocumentExceptionStatus.REJECTED)
    expect(auditLogsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REJECTED',
        metadata: expect.objectContaining({
          justification: 'Documento não atende aos requisitos mínimos',
        }),
      }),
    )
  })

  it('deve lançar erro se a exceção não for encontrada', async () => {
    exceptionsRepositoryMock.findById.mockResolvedValueOnce(null)

    await expect(
      useCase.execute({
        documentExceptionId: 'exc-inexistente',
        action: 'APPROVE',
        actorId: 'supervisor-001',
      }),
    ).rejects.toThrow('Exceção documental não encontrada')
  })

  it('deve lançar erro se a exceção não estiver PENDING', async () => {
    exceptionsRepositoryMock.findById.mockResolvedValueOnce({
      ...mockPendingException,
      status: DocumentExceptionStatus.APPROVED,
    })

    await expect(
      useCase.execute({
        documentExceptionId: 'exc-123',
        action: 'APPROVE',
        actorId: 'supervisor-001',
      }),
    ).rejects.toThrow('Apenas exceções pendentes podem ser revisadas')
  })

  it('deve lançar erro se parâmetros obrigatórios estiverem ausentes', async () => {
    await expect(
      useCase.execute({
        documentExceptionId: '',
        action: 'APPROVE',
        actorId: 'supervisor-001',
      }),
    ).rejects.toThrow('Parâmetros obrigatórios ausentes')
  })
})
