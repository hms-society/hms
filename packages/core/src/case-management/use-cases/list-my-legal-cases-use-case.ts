import type { LegalCaseSummary } from '../domain/entities'
import type { LegalCasesRepository } from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  collaboratorId: string
}

export class ListMyLegalCasesUseCase
  implements UseCase<Request, readonly LegalCaseSummary[]>
{
  constructor(private readonly legalCasesRepository: LegalCasesRepository) {}

  execute({ collaboratorId }: Request): Promise<readonly LegalCaseSummary[]> {
    return this.legalCasesRepository.listByTeamMember(collaboratorId)
  }
}
