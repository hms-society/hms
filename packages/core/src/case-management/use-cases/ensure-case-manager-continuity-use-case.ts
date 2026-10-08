import type {
  CaseIdentityTransaction,
  CaseIdentityTransactionScope,
  DatetimeProvider,
} from '#shared/interfaces'
import type { UseCase } from '#shared/interfaces/use-case'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { CaseTeamHistoryKind, CaseMemberRole } from '../domain/structures'
import type { CaseEligibilitySnapshot } from '../domain/structures'
import type { CaseTeamHistoryCreation } from '../domain/entities'
import type { EnsureCaseManagerContinuityRequest } from './ensure-case-manager-continuity-request'

const eligible = (profile: string, status: string) =>
  status === UserStatus.Active &&
  (profile === CollaboratorProfile.Lawyer ||
    profile === CollaboratorProfile.Paralegal ||
    profile === CollaboratorProfile.Supervisor)

export class EnsureCaseManagerContinuityUseCase
  implements UseCase<EnsureCaseManagerContinuityRequest, void>
{
  constructor(
    private readonly transaction: CaseIdentityTransaction,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  execute(request: EnsureCaseManagerContinuityRequest): Promise<void> {
    return this.transaction.run((scope) => this.executeWithin(scope, request))
  }

  async executeWithin(
    scope: CaseIdentityTransactionScope,
    request: EnsureCaseManagerContinuityRequest,
  ): Promise<void> {
    const collaborator = await scope.identity.collaboratorsRepository.findById(
      request.collaboratorId,
    )
    if (!collaborator) throw new NotFoundError('O colaborador não foi encontrado.')
    const user = await scope.identity.usersRepository.findById(collaborator.userId)
    if (!user) throw new NotFoundError('A conta do colaborador não foi encontrada.')
    const previousEligibility: CaseEligibilitySnapshot = {
      profile: collaborator.profile,
      status: user.status,
    }
    const nextEligibility: CaseEligibilitySnapshot = {
      profile: request.nextProfile,
      status: request.nextStatus,
    }
    const cases = await this.findAffectedCases(scope, request.collaboratorId)
    await this.ensureSuccessorManagers(scope, cases, request)
    await this.recordEligibilityChanges(
      scope,
      cases,
      request,
      previousEligibility,
      nextEligibility,
    )
  }

  private async findAffectedCases(
    scope: CaseIdentityTransactionScope,
    collaboratorId: string,
  ) {
    const memberships =
      await scope.cases.caseMembersRepository.listByCollaboratorId(collaboratorId)
    const activeManagers = memberships.filter(
      (member) =>
        member.role === CaseMemberRole.Manager &&
        !member.removedAt &&
        !member.archivedLegacy,
    )
    return Promise.all(
      activeManagers.map(async (membership) => ({
        membership,
        legalCase: await scope.cases.legalCasesRepository.findById(membership.caseId),
        members: await scope.cases.caseMembersRepository.listByCaseId(membership.caseId),
      })),
    )
  }

  private async ensureSuccessorManagers(
    scope: CaseIdentityTransactionScope,
    cases: Awaited<ReturnType<EnsureCaseManagerContinuityUseCase['findAffectedCases']>>,
    request: EnsureCaseManagerContinuityRequest,
  ): Promise<void> {
    for (const { membership, legalCase, members } of cases) {
      if (!legalCase) continue
      const managers = members.filter(
        (candidate) =>
          candidate.id !== membership.id &&
          candidate.role === CaseMemberRole.Manager &&
          !candidate.removedAt &&
          !candidate.archivedLegacy,
      )
      const profiles = await Promise.all(
        managers.map((candidate) =>
          scope.cases.caseCollaboratorsProvider.findById(candidate.collaboratorId),
        ),
      )
      const hasOtherManager = profiles.some(
        (candidate) => candidate && eligible(candidate.profile, candidate.status),
      )
      if (!eligible(request.nextProfile, request.nextStatus) && !hasOtherManager) {
        throw new ConflictError('A alteração deixaria um Caso sem Gestor elegível.')
      }
    }
  }

  private async recordEligibilityChanges(
    scope: CaseIdentityTransactionScope,
    cases: Awaited<ReturnType<EnsureCaseManagerContinuityUseCase['findAffectedCases']>>,
    request: EnsureCaseManagerContinuityRequest,
    previousEligibility: CaseEligibilitySnapshot,
    nextEligibility: CaseEligibilitySnapshot,
  ): Promise<void> {
    for (const { membership, legalCase } of cases) {
      if (!legalCase) continue
      const version = await scope.cases.legalCasesRepository.replaceTeamVersion(
        legalCase.id,
        legalCase.teamVersion,
      )
      const history: CaseTeamHistoryCreation = {
        caseId: legalCase.id,
        membershipId: membership.id,
        collaboratorId: request.collaboratorId,
        actorId: request.actorId,
        kind: CaseTeamHistoryKind.EligibilityChanged,
        occurredAt: this.datetimeProvider.now(),
        teamVersion: version,
        previousRole: membership.role,
        nextRole: membership.role,
        previousEligibility,
        nextEligibility,
        operationId: request.operationId,
      }
      await scope.cases.caseTeamHistoriesRepository.add(history)
    }
  }
}
