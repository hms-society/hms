import type { CaseIdentityTransaction } from '#shared/interfaces/case-identity-transaction'
import type { DatetimeProvider, UseCase } from '#shared/interfaces'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type { CaseMember, CaseTeamMemberCreation } from '../domain/entities'
import type { CaseTeamMutationResult } from '../domain/structures'
import { CaseTeamHistoryKind, CaseTeamRole } from '../domain/structures'
import type { CaseTeamScope } from '../interfaces/case-team-scope'
import type { AddCaseTeamMemberRequest } from './add-case-team-member-request'
import {
  isEligibleCaseCollaborator,
  prepareCaseTeamMutation,
  recordCaseTeamMutation,
} from './case-team-mutation-helpers'

export class AddCaseTeamMemberUseCase
  implements UseCase<AddCaseTeamMemberRequest, CaseTeamMutationResult>
{
  constructor(
    private readonly transaction: CaseIdentityTransaction,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: AddCaseTeamMemberRequest): Promise<CaseTeamMutationResult> {
    return this.transaction.run(async ({ cases }) => {
      const prepared = await prepareCaseTeamMutation(cases, request, 'add', {
        collaboratorId: request.collaboratorId,
        role: request.role,
      })
      if ('replay' in prepared) return prepared.replay

      const target = await cases.caseCollaboratorsProvider.findById(
        request.collaboratorId,
      )
      if (!target) throw new NotFoundError('O colaborador não foi encontrado.')
      if (!isEligibleCaseCollaborator(target.profile, target.status)) {
        throw new ConflictError('O colaborador não está elegível para integrar a equipe.')
      }
      const existing = await cases.caseMembersRepository.findByCaseAndCollaborator(
        request.caseId,
        request.collaboratorId,
      )
      if (existing && !existing.removedAt)
        throw new ConflictError('O colaborador já integra a equipe.')
      if (existing?.archivedLegacy)
        throw new ConflictError('O vínculo legado requer correção explícita.')
      await this.ensureManagerRemains(cases, request.caseId, request.role)

      const at = this.datetimeProvider.now()
      const membership = await this.addMembership(cases, request, existing, at)
      return recordCaseTeamMutation(cases, request, prepared.context, membership, {
        kind: CaseTeamHistoryKind.Added,
        occurredAt: at,
        nextRole: request.role,
      })
    })
  }

  private async ensureManagerRemains(
    scope: CaseTeamScope,
    caseId: string,
    role: CaseTeamRole,
  ): Promise<void> {
    const members = await scope.caseMembersRepository.listByCaseId(caseId)
    const active = members.filter((member) => !member.removedAt && !member.archivedLegacy)
    const collaborators = await Promise.all(
      active.map((member) =>
        scope.caseCollaboratorsProvider.findById(member.collaboratorId),
      ),
    )
    const hasManager = active.some(
      (member, index) =>
        member.role === CaseTeamRole.Manager &&
        collaborators[index] !== undefined &&
        isEligibleCaseCollaborator(
          collaborators[index].profile,
          collaborators[index].status,
        ),
    )
    if (!hasManager && role !== CaseTeamRole.Manager) {
      throw new ConflictError('O Caso precisa manter um Gestor elegível.')
    }
  }

  private async addMembership(
    scope: CaseTeamScope,
    request: AddCaseTeamMemberRequest,
    existing: CaseMember | undefined,
    at: Date,
  ): Promise<CaseMember> {
    if (existing) {
      return scope.caseMembersRepository.replace(existing.id, {
        role: request.role,
        assignedAt: at,
        assignedBy: request.actorId,
        removedAt: undefined,
        removedBy: undefined,
      })
    }
    const creation: CaseTeamMemberCreation = {
      caseId: request.caseId,
      collaboratorId: request.collaboratorId,
      role: request.role,
      assignedAt: at,
      assignedBy: request.actorId,
      archivedLegacy: false,
    }
    const [membership] = await scope.caseMembersRepository.addMany([creation])
    if (!membership) throw new Error('O vínculo da equipe não foi criado.')
    return membership
  }
}
