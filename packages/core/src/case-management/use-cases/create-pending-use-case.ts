import type { UseCase } from '#shared/interfaces/use-case'
import type { AssistedMessage, Pending } from '../domain/entities'
import { AssistedMessageStatus, PendingReason } from '../domain/structures'
import type { PendingsRepository } from '../interfaces'

type Request = {
  caseId: string
  checklistItemId: string
  documentFileId?: string
  documentFileName?: string
  reason: PendingReason
  details?: string
  clientName?: string
  responsibleId: string
}

export class CreatePendingUseCase
  implements UseCase<Request, { pending: Pending; message: AssistedMessage }>
{
  constructor(private readonly pendingsRepository: PendingsRepository) {}

  async execute(request: Request) {
    const message = createAssistedMessage(request)

    return this.pendingsRepository.createWithMessage({
      pending: {
        caseId: request.caseId,
        checklistItemId: request.checklistItemId,
        documentFileId: request.documentFileId,
        documentFileName: request.documentFileName,
        reason: request.reason,
        details: request.details,
        responsibleId: request.responsibleId,
      },
      message: {
        caseId: request.caseId,
        checklistItemId: request.checklistItemId,
        subject: message.subject,
        body: message.body,
        status: AssistedMessageStatus.AwaitingApproval,
      },
    })
  }
}

export function createAssistedMessage(
  request: Pick<Request, 'reason' | 'documentFileName' | 'details' | 'clientName'>,
) {
  const documentName = request.documentFileName ?? 'documento solicitado'
  const clientName = request.clientName?.trim() || 'cliente'
  const reasonCopy = {
    [PendingReason.Missing]: `Ainda não recebemos o documento ${documentName}.`,
    [PendingReason.Illegible]: `O documento ${documentName} recebido está ilegível.`,
    [PendingReason.Incomplete]: `O documento ${documentName} recebido está incompleto.`,
    [PendingReason.Duplicate]: `Já identificamos um documento equivalente a ${documentName}.`,
    [PendingReason.NotCorresponding]: `O documento recebido não corresponde a ${documentName}.`,
  }[request.reason]

  return {
    subject: `Novo envio necessário: ${documentName}`,
    body: `Olá, ${clientName}. ${reasonCopy} ${request.details ?? 'Por favor, envie uma nova versão para continuidade do atendimento.'}`,
  }
}
