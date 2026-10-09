import type { UseCase } from '#shared/interfaces/use-case'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { CaseTeamHistory } from '../domain/entities'
import type {
  CaseMembersRepository,
  CaseCollaboratorsProvider,
  CaseTeamHistoriesRepository,
  LegalCasesRepository,
} from '../interfaces'
import type { ListCaseTeamHistoryRequest } from './list-case-team-history-request'
import type { PaginationResponse } from '#shared/responses/pagination-response'
import { CollaboratorProfile, UserStatus } from '#shared/domain/structures'

export class ListCaseTeamHistoryUseCase
  implements UseCase<ListCaseTeamHistoryRequest, PaginationResponse<CaseTeamHistory>>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
    private readonly historiesRepository: CaseTeamHistoriesRepository,
    private readonly collaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  async execute(
    request: ListCaseTeamHistoryRequest,
  ): Promise<PaginationResponse<CaseTeamHistory>> {
    const legalCase = await this.legalCasesRepository.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    const actor = await this.collaboratorsProvider.findById(request.actorId)
    if (!actor || actor.status !== UserStatus.Active)
      throw new ForbiddenError('Acesso ao histórico não autorizado.')
    const member = await this.caseMembersRepository.findByCaseAndCollaborator(
      request.caseId,
      request.actorId,
    )
    const legalProfile =
      actor.profile === CollaboratorProfile.Lawyer ||
      actor.profile === CollaboratorProfile.Paralegal ||
      actor.profile === CollaboratorProfile.Supervisor
    if (
      actor.profile !== CollaboratorProfile.Admin &&
      (!legalProfile || !member || member.removedAt || member.archivedLegacy)
    ) {
      throw new ForbiddenError('Acesso ao histórico não autorizado.')
    }
    return this.historiesRepository.listByCaseId(request.caseId, {
      page: request.page,
      pageSize: request.pageSize,
    })
  }
}
