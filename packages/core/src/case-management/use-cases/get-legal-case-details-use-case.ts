import { AppError } from '#shared/domain/errors'

import type { LegalCaseSummary } from '../domain/entities'
import type { LegalCasesRepository } from '../interfaces'

export type GetLegalCaseDetailsUseCaseParams = {
  caseId: string
}

export class GetLegalCaseDetailsUseCase {
  constructor(private readonly legalCasesRepository: LegalCasesRepository) {}

  async execute(params: GetLegalCaseDetailsUseCaseParams): Promise<LegalCaseSummary> {
    const caseDetails = await this.legalCasesRepository.getCaseDetails(params.caseId)

    if (!caseDetails) {
      throw new AppError('Caso jurídico não encontrado.', 'Caso Inexistente')
    }

    return caseDetails
  }
}
