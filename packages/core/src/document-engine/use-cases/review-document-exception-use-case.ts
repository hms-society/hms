import { AppError } from '#shared/domain/errors'
import type { DocumentException } from '../domain/entities/document-exception'
import { DocumentExceptionStatus } from '../domain/structures'
import type { DocumentExceptionAuditLogsRepository } from '../interfaces/document-exception-audit-logs-repository'
import type { DocumentExceptionsRepository } from '../interfaces/document-exceptions-repository'

export type ReviewDocumentExceptionUseCaseParams = {
  documentExceptionId: string
  action: 'APPROVE' | 'REJECT'
  justification?: string
  actorId: string
}

export class ReviewDocumentExceptionUseCase {
  constructor(
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
    private readonly auditLogsRepository: DocumentExceptionAuditLogsRepository,
  ) {}

  async execute(params: ReviewDocumentExceptionUseCaseParams): Promise<DocumentException> {
    const { documentExceptionId, action, justification, actorId } = params

    if (!documentExceptionId || !action || !actorId) {
      throw new AppError(
        'Parâmetros obrigatórios ausentes para revisar exceção',
        'Requisição Inválida',
      )
    }

    const exception = await this.documentExceptionsRepository.findById(documentExceptionId)

    if (!exception) {
      throw new AppError('Exceção documental não encontrada', 'Não Encontrado')
    }

    if (exception.status !== DocumentExceptionStatus.PENDING) {
      throw new AppError(
        'Apenas exceções pendentes podem ser revisadas',
        'Requisição Inválida',
      )
    }

    const newStatus =
      action === 'APPROVE'
        ? DocumentExceptionStatus.APPROVED
        : DocumentExceptionStatus.REJECTED

    const updatedException = await this.documentExceptionsRepository.updateStatus(
      documentExceptionId,
      {
        status: newStatus,
        reviewedBy: actorId,
      },
    )

    await this.auditLogsRepository.create({
      documentExceptionId,
      action: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      userId: actorId,
      metadata: { justification },
    })

    return updatedException
  }
}
