import { AppError } from '#shared/domain/errors'
import type { DocumentException } from '../domain/entities/document-exception'
import {
  DocumentExceptionStatus,
  DocumentExceptionType,
} from '../domain/structures'
import type { DocumentExceptionAuditLogsRepository } from '../interfaces/document-exception-audit-logs-repository'
import type { DocumentExceptionsRepository } from '../interfaces/document-exceptions-repository'

export type RequestDocumentExceptionUseCaseParams = {
  documentId: string
  caseId: string
  type: string
  justification: string
  deadlineDate?: Date | null
  actorId: string
}

export class RequestDocumentExceptionUseCase {
  constructor(
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
    private readonly auditLogsRepository: DocumentExceptionAuditLogsRepository,
  ) {}

  async execute(params: RequestDocumentExceptionUseCaseParams): Promise<DocumentException> {
    const { documentId, caseId, type, justification, deadlineDate, actorId } = params

    if (!documentId || !caseId || !type || !justification) {
      throw new AppError(
        'Parâmetros obrigatórios ausentes para solicitar exceção',
        'Requisição Inválida',
      )
    }

    if (
      type !== DocumentExceptionType.DISPENSA_DEFINITIVA &&
      type !== DocumentExceptionType.ACEITE_PROVISORIO
    ) {
      throw new AppError('Tipo de exceção inválido', 'Requisição Inválida')
    }

    if (type === DocumentExceptionType.ACEITE_PROVISORIO && !deadlineDate) {
      throw new AppError(
        'Data limite é obrigatória para Aceite Provisório',
        'Requisição Inválida',
      )
    }

    const exception = await this.documentExceptionsRepository.create({
      documentId,
      caseId,
      type,
      status: DocumentExceptionStatus.PENDING,
      justification,
      deadlineDate: type === DocumentExceptionType.ACEITE_PROVISORIO ? deadlineDate : null,
      createdBy: actorId,
    })

    await this.auditLogsRepository.create({
      documentExceptionId: exception.id,
      action: 'REQUESTED',
      userId: actorId,
      metadata: { justification, deadlineDate },
    })

    return exception
  }
}
