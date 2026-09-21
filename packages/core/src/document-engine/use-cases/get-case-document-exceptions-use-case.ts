import { AppError } from '#shared/domain/errors'
import type { DocumentException } from '../domain/entities/document-exception'
import type { DocumentExceptionsRepository } from '../interfaces/document-exceptions-repository'

export type GetCaseDocumentExceptionsUseCaseParams = {
  caseId: string
}

export class GetCaseDocumentExceptionsUseCase {
  constructor(
    private readonly documentExceptionsRepository: DocumentExceptionsRepository,
  ) {}

  async execute(
    params: GetCaseDocumentExceptionsUseCaseParams,
  ): Promise<DocumentException[]> {
    const { caseId } = params

    if (!caseId) {
      throw new AppError('O ID do caso é obrigatório', 'Requisição Inválida')
    }

    return this.documentExceptionsRepository.findByCaseId(caseId)
  }
}
