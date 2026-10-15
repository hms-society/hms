import type {
  CaseIdentityTransaction,
  DatetimeProvider,
  UseCase,
} from '#shared/interfaces'
import { ConflictError } from '#shared/domain/errors/conflict-error'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import type { CaseTeamHistoryCreation, LegalCase } from '../domain/entities'
import {
  CaseMemberRole,
  CaseTeamHistoryKind,
  LegalCaseStatus,
} from '../domain/structures'
import type { CaseCollaboratorsProvider, CaseOpeningSourceProvider } from '../interfaces'
import type { CaseTeamScope } from '../interfaces/case-team-scope'
import type { CreateLegalCaseRequest } from './create-legal-case-request'

const isLegalProfile = (profile: string) =>
  profile === CollaboratorProfile.Lawyer ||
  profile === CollaboratorProfile.Paralegal ||
  profile === CollaboratorProfile.Supervisor
const isEligible = (profile: string, status: string) =>
  status === UserStatus.Active && isLegalProfile(profile)

type InitialTeam = {
  clientId: string
  team: Array<{ collaboratorId: string; role: CaseMemberRole }>
}

type CaseCreationFailure = {
  message?: unknown
  constraint_name?: unknown
  cause?: unknown
}

export class CreateLegalCaseUseCase
  implements UseCase<CreateLegalCaseRequest, LegalCase>
{
  constructor(
    private readonly transaction: CaseIdentityTransaction,
    private readonly openingSourceProvider: CaseOpeningSourceProvider,
    private readonly collaboratorsProvider: CaseCollaboratorsProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: CreateLegalCaseRequest): Promise<LegalCase> {
    try {
      return await this.transaction.run(({ cases }) => this.createWithin(cases, request))
    } catch (error) {
      if (this.hasConstraintFailure(error, ['case_creation_operations_actor_key_uidx'])) {
        throw new ConflictError('A chave da operação já foi usada com outro conteúdo.')
      }
      throw error
    }
  }

  private async createWithin(
    scope: CaseTeamScope,
    request: CreateLegalCaseRequest,
  ): Promise<LegalCase> {
    await this.authorizeActor(request.actorId)
    const fingerprint = fingerprintCreateRequest(request)
    const previous = await scope.caseCreationOperationsRepository.findByKey(
      request.actorId,
      request.operationId,
    )
    if (previous) return replayCreation(previous, fingerprint)
    if (!request.title.trim()) throw new ConflictError('O título do Caso é obrigatório.')

    const initialTeam = await this.resolveInitialTeam(request)
    const at = this.datetimeProvider.now()
    const legalCase = await this.persistCase(scope, request, initialTeam, at)
    await this.recordInitialMemberships(scope, legalCase, request, at)
    await scope.caseCreationOperationsRepository.add({
      intakeId: request.intakeId,
      actorId: request.actorId,
      operationId: request.operationId,
      fingerprint,
      result: legalCase,
      createdAt: at,
    })
    return legalCase
  }

  private async authorizeActor(actorId: string): Promise<void> {
    const actor = await this.collaboratorsProvider.findById(actorId)
    if (
      !actor ||
      actor.status !== UserStatus.Active ||
      (actor.profile !== CollaboratorProfile.Admin &&
        actor.profile !== CollaboratorProfile.Lawyer)
    ) {
      throw new ForbiddenError('Abertura de Caso não autorizada.')
    }
  }

  private async resolveInitialTeam(
    request: CreateLegalCaseRequest,
  ): Promise<InitialTeam> {
    const source = await this.openingSourceProvider.findByIntakeId(request.intakeId)
    if (!source)
      throw new NotFoundError('A origem de abertura do Caso não foi encontrada.')
    const initialManager = await this.collaboratorsProvider.findById(
      request.initialManagerCollaboratorId,
    )
    if (
      !initialManager ||
      initialManager.profile !== CollaboratorProfile.Lawyer ||
      initialManager.status !== UserStatus.Active
    ) {
      throw new ConflictError('Selecione um Advogado ativo como Gestor inicial.')
    }
    assertUniqueInitialTeam(request)
    const teamMembers = await Promise.all(
      request.team.map(async (member) => {
        const collaborator = await this.collaboratorsProvider.findById(
          member.collaboratorId,
        )
        if (!collaborator)
          throw new NotFoundError('Um colaborador da equipe não foi encontrado.')
        if (!isEligible(collaborator.profile, collaborator.status)) {
          throw new ConflictError('A equipe inicial contém um colaborador inelegível.')
        }
        return { collaboratorId: collaborator.collaboratorId, role: member.role }
      }),
    )
    return {
      clientId: source.clientId,
      team: [
        { collaboratorId: initialManager.collaboratorId, role: CaseMemberRole.Manager },
        ...teamMembers,
      ],
    }
  }

  private async persistCase(
    scope: CaseTeamScope,
    request: CreateLegalCaseRequest,
    initialTeam: InitialTeam,
    at: Date,
  ): Promise<LegalCase> {
    try {
      return await scope.legalCasesRepository.createCaseWithTeam({
        legalCase: {
          title: request.title.trim(),
          description: request.description?.trim() || undefined,
          clientId: initialTeam.clientId,
          intakeId: request.intakeId,
          legalAreaId: request.legalAreaId,
          legalTopicId: request.legalTopicId,
          status: LegalCaseStatus.Documentation,
          teamVersion: 1,
          openedAt: at,
        },
        team: initialTeam.team.map(({ collaboratorId, role }) => ({
          collaboratorId,
          role,
          assignedAt: at,
          assignedBy: request.actorId,
          archivedLegacy: false,
        })),
      })
    } catch (error) {
      if (
        this.hasConstraintFailure(error, [
          'cases_intake_id_uidx',
          'case_members_case_collaborator_uidx',
        ])
      ) {
        throw new ConflictError(
          'O Intake já possui Caso ou a equipe inicial conflita com um vínculo existente.',
        )
      }
      throw error
    }
  }

  private async recordInitialMemberships(
    scope: CaseTeamScope,
    legalCase: LegalCase,
    request: CreateLegalCaseRequest,
    at: Date,
  ): Promise<void> {
    const memberships = await scope.caseMembersRepository.listByCaseId(legalCase.id)
    for (const member of memberships) {
      const history: CaseTeamHistoryCreation = {
        caseId: legalCase.id,
        membershipId: member.id,
        collaboratorId: member.collaboratorId,
        actorId: request.actorId,
        kind: CaseTeamHistoryKind.Added,
        occurredAt: at,
        teamVersion: legalCase.teamVersion ?? 0,
        nextRole: member.role,
        operationId: request.operationId,
      }
      await scope.caseTeamHistoriesRepository.add(history)
    }
  }

  private hasConstraintFailure(
    error: unknown,
    constraints: string[],
    seen = new Set<unknown>(),
  ): boolean {
    if (seen.has(error)) return false
    seen.add(error)
    return (
      this.matchesConstraint(error, constraints) ||
      this.hasConstraintFailure(this.getFailureCause(error), constraints, seen)
    )
  }

  private getFailureCause(error: unknown): unknown {
    return (error as CaseCreationFailure | undefined)?.cause
  }

  private matchesConstraint(error: unknown, constraints: string[]): boolean {
    const failure = error as CaseCreationFailure | undefined
    const message = typeof failure?.message === 'string' ? failure.message : ''
    return constraints.some(
      (constraint) =>
        failure?.constraint_name === constraint || message.includes(constraint),
    )
  }
}

function fingerprintCreateRequest(request: CreateLegalCaseRequest): string {
  return JSON.stringify({
    title: request.title.trim(),
    intakeId: request.intakeId,
    legalAreaId: request.legalAreaId,
    legalTopicId: request.legalTopicId,
    description: request.description?.trim() || undefined,
    initialManagerCollaboratorId: request.initialManagerCollaboratorId,
    team: request.team
      .map(({ collaboratorId, role }) => ({ collaboratorId, role }))
      .sort((left, right) => left.collaboratorId.localeCompare(right.collaboratorId)),
  })
}

function replayCreation(
  previous: Awaited<
    ReturnType<CaseTeamScope['caseCreationOperationsRepository']['findByKey']>
  >,
  fingerprint: string,
): LegalCase {
  if (!previous) throw new Error('A operação de abertura não foi encontrada.')
  if (previous.fingerprint !== fingerprint) {
    throw new ConflictError('A chave da operação já foi usada com outro conteúdo.')
  }
  return previous.result
}

function assertUniqueInitialTeam(request: CreateLegalCaseRequest): void {
  const ids = [
    request.initialManagerCollaboratorId,
    ...request.team.map((member) => member.collaboratorId),
  ]
  if (new Set(ids).size !== ids.length) {
    throw new ConflictError(
      'Um colaborador não pode aparecer mais de uma vez na equipe inicial.',
    )
  }
}
