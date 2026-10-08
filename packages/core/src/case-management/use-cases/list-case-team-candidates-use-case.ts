import type { UseCase } from '#shared/interfaces/use-case'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import type { PaginationResponse } from '#shared/responses/pagination-response'
import { CollaboratorProfile, UserStatus } from '#shared/domain/structures'
import type {
  CaseEligibleCollaborator,
  CaseTeamCandidatesQuery,
} from '../domain/structures'
import { CaseTeamRole } from '../domain/structures'
import type {
  CaseCollaboratorsProvider,
  CaseTeamMembersRepository,
  LegalCasesRepository,
} from '../interfaces'
import { LegalCaseNotFoundError } from '../domain/errors'

export type ListCaseTeamCandidatesRequest = CaseTeamCandidatesQuery & {
  actorId: string
  caseId?: string
}

export class ListCaseTeamCandidatesUseCase
  implements
    UseCase<ListCaseTeamCandidatesRequest, PaginationResponse<CaseEligibleCollaborator>>
{
  constructor(
    private readonly caseCollaboratorsProvider: CaseCollaboratorsProvider,
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseMembersRepository: CaseTeamMembersRepository,
  ) {}

  async execute(
    request: ListCaseTeamCandidatesRequest,
  ): Promise<PaginationResponse<CaseEligibleCollaborator>> {
    const actor = await this.caseCollaboratorsProvider.findById(request.actorId)
    if (
      !actor ||
      actor.status !== UserStatus.Active ||
      !isSupportedProfile(actor.profile)
    ) {
      throw new ForbiddenError('Acesso aos candidatos não autorizado.')
    }
    const excluded = request.caseId
      ? await this.getExcludedCollaborators(
          request.caseId,
          request.actorId,
          actor.profile,
        )
      : []
    return this.caseCollaboratorsProvider.listEligible(
      {
        page: request.page,
        pageSize: request.pageSize,
        profile: request.profile,
        search: request.search?.trim() || undefined,
      },
      excluded,
    )
  }

  private async getExcludedCollaborators(
    caseId: string,
    actorId: string,
    profile: string,
  ): Promise<readonly string[]> {
    const legalCase = await this.legalCasesRepository.findById(caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    await this.ensureCanSelectMembers(caseId, actorId, profile)
    const members = await this.caseMembersRepository.listByCaseId(caseId)
    return members
      .filter((member) => !member.removedAt && !member.archivedLegacy)
      .map((member) => member.collaboratorId)
  }

  private async ensureCanSelectMembers(
    caseId: string,
    actorId: string,
    profile: string,
  ): Promise<void> {
    if (profile === CollaboratorProfile.Admin) return
    const membership = await this.caseMembersRepository.findByCaseAndCollaborator(
      caseId,
      actorId,
    )
    if (
      !membership ||
      membership.removedAt ||
      membership.archivedLegacy ||
      membership.role !== CaseTeamRole.Manager
    ) {
      throw new ForbiddenError('Somente o Gestor do Caso pode selecionar integrantes.')
    }
  }
}

function isSupportedProfile(profile: string): boolean {
  return (
    profile === CollaboratorProfile.Admin ||
    profile === CollaboratorProfile.Lawyer ||
    profile === CollaboratorProfile.Paralegal ||
    profile === CollaboratorProfile.Supervisor
  )
}
