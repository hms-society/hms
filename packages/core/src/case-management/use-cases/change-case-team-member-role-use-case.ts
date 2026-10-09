import type { CaseIdentityTransaction } from '#shared/interfaces/case-identity-transaction'
import type { DatetimeProvider, UseCase } from '#shared/interfaces'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type { CaseMember } from '../domain/entities'
import type { CaseTeamMutationResult } from '../domain/structures'
import { CaseTeamHistoryKind, CaseMemberRole } from '../domain/structures'
import type { CaseTeamScope } from '../interfaces/case-team-scope'
import type { ChangeCaseTeamMemberRoleRequest } from './change-case-team-member-role-request'
import {
  isEligibleCaseCollaborator,
  prepareCaseTeamMutation,
  recordCaseTeamMutation,
} from './case-team-mutation-helpers'

export class ChangeCaseTeamMemberRoleUseCase
  implements UseCase<ChangeCaseTeamMemberRoleRequest, CaseTeamMutationResult>
{
  constructor(
    private readonly transaction: CaseIdentityTransaction,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(
    request: ChangeCaseTeamMemberRoleRequest,
  ): Promise<CaseTeamMutationResult> {
    return this.transaction.run(async ({ cases }) => {
      const prepared = await prepareCaseTeamMutation(cases, request, 'change_role', {
        membershipId: request.membershipId,
        role: request.role,
      })
      if ('replay' in prepared) return prepared.replay

      const target = await this.findActiveMembership(
        cases,
        request.caseId,
        request.membershipId,
      )
      if (target.role === request.role)
        throw new ConflictError('O integrante já possui esse nível.')
      await this.ensureManagerRemains(cases, request.caseId, target, request.role)

      const at = this.datetimeProvider.now()
      const membership = await cases.caseMembersRepository.replace(target.id, {
        role: request.role,
        assignedAt: target.assignedAt,
        assignedBy: target.assignedBy,
      })
      return recordCaseTeamMutation(cases, request, prepared.context, membership, {
        kind: CaseTeamHistoryKind.RoleChanged,
        occurredAt: at,
        previousRole: target.role,
        nextRole: request.role,
      })
    })
  }

  private async findActiveMembership(
    scope: CaseTeamScope,
    caseId: string,
    membershipId: string,
  ): Promise<CaseMember> {
    const members = await scope.caseMembersRepository.listByCaseId(caseId)
    const target = members.find((member) => member.id === membershipId)
    if (!target || target.removedAt || target.archivedLegacy) {
      throw new NotFoundError('O vínculo vigente não foi encontrado.')
    }
    return target
  }

  private async ensureManagerRemains(
    scope: CaseTeamScope,
    caseId: string,
    target: CaseMember,
    nextRole: CaseMemberRole,
  ): Promise<void> {
    const active = (await scope.caseMembersRepository.listByCaseId(caseId)).filter(
      (member) => !member.removedAt && !member.archivedLegacy,
    )
    const collaborators = await Promise.all(
      active.map((member) =>
        scope.caseCollaboratorsProvider.findById(member.collaboratorId),
      ),
    )
    const targetIndex = active.findIndex((member) => member.id === target.id)
    const targetCollaborator = collaborators[targetIndex]
    if (
      nextRole === CaseMemberRole.Manager &&
      (!targetCollaborator ||
        !isEligibleCaseCollaborator(
          targetCollaborator.profile,
          targetCollaborator.status,
        ))
    ) {
      throw new ConflictError(
        'Somente um colaborador jurídico ativo e elegível pode ser Gestor.',
      )
    }
    if (target.role !== CaseMemberRole.Manager || nextRole === CaseMemberRole.Manager) return
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
    if (!anotherManager)
      throw new ConflictError('O Caso precisa manter pelo menos um Gestor elegível.')
  }
}
