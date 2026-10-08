import type {
  CaseIdentityTransaction,
  CaseIdentityTransactionScope,
  DatetimeProvider,
} from '#shared/interfaces'
import type { UseCase } from '#shared/interfaces/use-case'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { CaseTeamHistoryKind, CaseTeamRole } from '../domain/structures'
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
    const pendingCases = await this.filterPreviouslyAppliedChanges(scope, cases, request)
    await this.ensureSuccessorManagers(scope, pendingCases, request)
    await this.recordEligibilityChanges(
      scope,
      pendingCases,
      request,
      previousEligibility,
      nextEligibility,
    )
  }

  private async filterPreviouslyAppliedChanges(
    scope: CaseIdentityTransactionScope,
    cases: Awaited<ReturnType<EnsureCaseManagerContinuityUseCase['findAffectedCases']>>,
    request: EnsureCaseManagerContinuityRequest,
  ) {
    const fingerprint = eligibilityChangeFingerprint(request)
    const pending = []
    for (const entry of cases) {
      if (!entry.legalCase) continue
      const previous = await scope.cases.caseTeamOperationsRepository.findByKey(
        entry.legalCase.id,
        request.actorId,
        request.operationId,
      )
      if (!previous) {
        pending.push(entry)
        continue
      }
      if (previous.fingerprint !== fingerprint) {
        throw new ConflictError('A chave da operação já foi usada com outro conteúdo.')
      }
    }
    return pending
  }

  private async findAffectedCases(
    scope: CaseIdentityTransactionScope,
    collaboratorId: string,
  ) {
    const memberships =
      await scope.cases.caseMembersRepository.listByCollaboratorId(collaboratorId)
    const activeManagers = memberships.filter(
      (member) =>
        member.role === CaseTeamRole.Manager &&
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
          candidate.role === CaseTeamRole.Manager &&
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
    const fingerprint = eligibilityChangeFingerprint(request)
    for (const { membership, legalCase } of cases) {
      if (!legalCase) continue
      const version = await scope.cases.legalCasesRepository.replaceTeamVersion(
        legalCase.id,
        legalCase.teamVersion ?? 0,
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
      const recordedHistory = await scope.cases.caseTeamHistoriesRepository.add(history)
      await scope.cases.caseTeamOperationsRepository.add({
        caseId: legalCase.id,
        actorId: request.actorId,
        operationId: request.operationId,
        fingerprint,
        result: {
          caseId: legalCase.id,
          membershipId: membership.id,
          teamVersion: version,
          historyId: recordedHistory.id,
        },
        createdAt: history.occurredAt,
      })
    }
  }
}

function eligibilityChangeFingerprint(
  request: EnsureCaseManagerContinuityRequest,
): string {
  return JSON.stringify({
    action: 'eligibility_changed',
    collaboratorId: request.collaboratorId,
    nextProfile: request.nextProfile,
    nextStatus: request.nextStatus,
  })
}
