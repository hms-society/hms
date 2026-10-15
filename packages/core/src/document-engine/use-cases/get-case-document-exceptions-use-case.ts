import { AppError } from '#shared/domain/errors'
import type { DocumentException } from '../domain/entities/document-exception'
import type { DocumentExceptionsRepository } from '../interfaces/document-exceptions-repository'
import type { CaseAccessProvider } from '../../case-management/interfaces/case-access-provider'
import { CaseAccessIntent } from '../../case-management/domain/structures/case-access-intent'

export type GetCaseDocumentExceptionsUseCaseParams = {
  caseId: string
  actorId: string
}

export class GetCaseDocumentExceptionsUseCase {
  constructor(
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(
    params: GetCaseDocumentExceptionsUseCaseParams,
  ): Promise<DocumentException[]> {
    const { caseId } = params

    if (!caseId) {
      throw new AppError('O ID do caso é obrigatório', 'Requisição Inválida')
    }

    await this.caseAccessProvider.authorize({
      caseId,
      actorId: params.actorId,
      intent: CaseAccessIntent.ReadDocument,
    })
    return this.documentExceptionsRepository.findByCaseId(caseId)
  }
}
