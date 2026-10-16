import { BadRequestError } from '#shared/domain/errors'
import type { DocumentException } from '../domain/entities/document-exception'
import { DocumentExceptionStatus, DocumentExceptionType } from '../domain/structures'
import type { DocumentExceptionAuditLogsRepository } from '../interfaces/document-exception-audit-logs-repository'
import type { DocumentExceptionsRepository } from '../interfaces/document-exceptions-repository'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'

export type RequestDocumentExceptionUseCaseParams = {
  documentId?: string | null
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
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(
    params: RequestDocumentExceptionUseCaseParams,
  ): Promise<DocumentException> {
    const { documentId, caseId, type, justification, deadlineDate, actorId } = params

    if (!caseId || !type || !justification) {
      throw new BadRequestError('Parâmetros obrigatórios ausentes para solicitar exceção')
    }

    if (
      type !== DocumentExceptionType.DISPENSA_DEFINITIVA &&
      type !== DocumentExceptionType.ACEITE_PROVISORIO
    ) {
      throw new BadRequestError('Tipo de exceção inválido')
    }

    if (type === DocumentExceptionType.ACEITE_PROVISORIO && !deadlineDate) {
      throw new BadRequestError('Data limite é obrigatória para Aceite Provisório')
    }

    await this.caseAccessProvider.authorize({
      caseId,
      actorId,
      intent: CaseAccessIntent.ManageDocumentException,
    })

    const exception = await this.documentExceptionsRepository.create({
      documentId,
      caseId,
      type,
      status: DocumentExceptionStatus.PENDING,
      justification,
      deadlineDate:
        type === DocumentExceptionType.ACEITE_PROVISORIO ? deadlineDate : null,
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
