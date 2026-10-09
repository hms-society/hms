import type { CaseIdentityTransaction } from '#shared/interfaces/case-identity-transaction'
import type { DatetimeProvider, UseCase } from '#shared/interfaces'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type { CaseMember } from '../domain/entities'
import type { CaseTeamMutationResult } from '../domain/structures'
import { CaseMemberRole, CaseTeamHistoryKind } from '../domain/structures'
import type { CaseTeamScope } from '../interfaces/case-team-scope'
import type { RemoveCaseTeamMemberRequest } from './remove-case-team-member-request'
import {
  isEligibleCaseCollaborator,
  prepareCaseTeamMutation,
  recordCaseTeamMutation,
} from './case-team-mutation-helpers'

export class RemoveCaseTeamMemberUseCase
  implements UseCase<RemoveCaseTeamMemberRequest, CaseTeamMutationResult>
{
  constructor(
    private readonly transaction: CaseIdentityTransaction,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: RemoveCaseTeamMemberRequest): Promise<CaseTeamMutationResult> {
    return this.transaction.run(async ({ cases }) => {
      const prepared = await prepareCaseTeamMutation(cases, request, 'remove', {
        membershipId: request.membershipId,
      })
      if ('replay' in prepared) return prepared.replay

      const members = await cases.caseMembersRepository.listByCaseId(request.caseId)
      const target = this.findActiveMembership(members, request.membershipId)
      await this.ensureManagerRemains(cases, target, members)
      const at = this.datetimeProvider.now()
      const membership = await cases.caseMembersRepository.replace(target.id, {
        role: target.role,
        assignedAt: target.assignedAt,
        assignedBy: target.assignedBy,
        removedAt: at,
        removedBy: request.actorId,
      })
      return recordCaseTeamMutation(cases, request, prepared.context, membership, {
        kind: CaseTeamHistoryKind.Removed,
        occurredAt: at,
        previousRole: target.role,
      })
    })
  }

  private findActiveMembership(
    members: readonly CaseMember[],
    membershipId: string,
  ): CaseMember {
    const target = members.find((member) => member.id === membershipId)
    if (!target || target.removedAt || target.archivedLegacy) {
      throw new NotFoundError('O vínculo vigente não foi encontrado.')
    }
    return target
  }

  private async ensureManagerRemains(
    scope: CaseTeamScope,
    target: CaseMember,
    members: readonly CaseMember[],
  ): Promise<void> {
    const active = members.filter((member) => !member.removedAt && !member.archivedLegacy)
    const collaborators = await Promise.all(
      active.map((member) =>
        scope.caseCollaboratorsProvider.findById(member.collaboratorId),
      ),
    )
    const anotherManager = active.some(
      (member, index) =>
        member.id !== target.id &&
        member.role === CaseMemberRole.Manager &&
        collaborators[index] !== undefined &&
        isEligibleCaseCollaborator(
          collaborators[index].profile,
          collaborators[index].status,
        ),
    )
    if (target.role === CaseMemberRole.Manager && !anotherManager) {
      throw new ConflictError('O Caso precisa manter pelo menos um Gestor elegível.')
    }
  }
}
