import type { LegalCaseSummary } from '../domain/entities'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
  LegalCasesRepository,
} from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'
import type { ClientsRepository } from '../../identity/interfaces/clients-repository'
import type { LegalAreasRepository } from '../../legal-catalog/interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '../../legal-catalog/interfaces/legal-topics-repository'
import { projectLegalCaseSummary } from './project-legal-case-summary'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { UserStatus } from '#shared/domain/structures'

type Request = {
  collaboratorId: string
  clientId?: string
}

export class ListMyLegalCasesUseCase
  implements UseCase<Request, readonly LegalCaseSummary[]>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
    private readonly collaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  async execute({ collaboratorId, clientId }: Request): Promise<readonly LegalCaseSummary[]> {
    const collaborator = await this.collaboratorsProvider.findById(collaboratorId)
    if (!collaborator || collaborator.status !== UserStatus.Active) {
      throw new ForbiddenError('Acesso jurídico ao Caso não autorizado.')
    }
    const legalCases = await this.legalCasesRepository.listByTeamMember(
      collaboratorId,
      clientId,
    )
    return Promise.all(
      legalCases.map((legalCase) =>
        projectLegalCaseSummary(legalCase, {
          clientsRepository: this.clientsRepository,
          legalAreasRepository: this.legalAreasRepository,
          legalTopicsRepository: this.legalTopicsRepository,
          caseMembersRepository: this.caseMembersRepository,
          collaboratorsProvider: this.collaboratorsProvider,
        }),
      ),
    )
  }
}
