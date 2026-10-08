import type { UseCase } from '#shared/interfaces/use-case'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { CaseTeam } from '../domain/structures'
import type { CaseMember } from '../domain/entities'
import { CaseTeamRole } from '../domain/structures'
import type {
  CaseTeamMembersRepository,
  CaseCollaboratorsProvider,
  LegalCasesRepository,
} from '../interfaces'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { UserStatus, CollaboratorProfile } from '#shared/domain/structures'

export type CaseActorRequest = { caseId: string; actorId: string }

export class GetCaseTeamUseCase implements UseCase<CaseActorRequest, CaseTeam> {
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseMembersRepository: CaseTeamMembersRepository,
    private readonly caseCollaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  async execute(request: CaseActorRequest): Promise<CaseTeam> {
    const legalCase = await this.legalCasesRepository.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    const actor = await this.caseCollaboratorsProvider.findById(request.actorId)
    if (!actor || actor.status !== UserStatus.Active)
      throw new ForbiddenError('Acesso ao Caso não autorizado.')
    const members = await this.caseMembersRepository.listByCaseId(request.caseId)
    const actorMembership = members.find(
      (member) =>
        member.collaboratorId === request.actorId &&
        !member.removedAt &&
        !member.archivedLegacy,
    )
    const currentMembers = members.filter(
      (member) => !member.removedAt && !member.archivedLegacy,
    )
    ensureActorCanViewTeam(actor.profile, actorMembership)
    const profiles = await Promise.all(
      currentMembers.map((member) =>
        this.caseCollaboratorsProvider.findById(member.collaboratorId),
      ),
    )
    return {
      caseId: legalCase.id,
      publicCode: legalCase.publicCode,
      status: legalCase.status,
      teamVersion: legalCase.teamVersion ?? 0,
      members: projectCurrentMembers(currentMembers, profiles),
      total: currentMembers.length,
      activeManagerCount: countEligibleManagers(currentMembers, profiles),
      canManage:
        actor.profile === CollaboratorProfile.Admin ||
        actorMembership?.role === CaseTeamRole.Manager,
      requiresAdministrativeReason: actor.profile === CollaboratorProfile.Admin,
    }
  }
}

function ensureActorCanViewTeam(
  profile: string,
  membership: CaseMember | undefined,
): void {
  const isAdmin = profile === CollaboratorProfile.Admin
  const isLegalMember = isLegalProfile(profile) && Boolean(membership)
  if (!isAdmin && !isLegalMember)
    throw new ForbiddenError('Acesso ao Caso não autorizado.')
}

function projectCurrentMembers(
  members: Awaited<ReturnType<CaseTeamMembersRepository['listByCaseId']>>,
  profiles: Awaited<ReturnType<CaseCollaboratorsProvider['findById']>>[],
) {
  return members.flatMap((member, index) => {
    const collaborator = profiles[index]
    if (!collaborator) return []
    return [
      {
        membershipId: member.id,
        collaboratorId: member.collaboratorId,
        professionalName: collaborator.professionalName,
        email: collaborator.email,
        profile: collaborator.profile,
        role: member.role,
        assignedAt: member.assignedAt,
        isEligible: isEligibleProfile(collaborator.profile, collaborator.status),
      },
    ]
  })
}

function countEligibleManagers(
  members: Awaited<ReturnType<CaseTeamMembersRepository['listByCaseId']>>,
  profiles: Awaited<ReturnType<CaseCollaboratorsProvider['findById']>>[],
): number {
  return members.filter(
    (member, index) =>
      member.role === CaseTeamRole.Manager &&
      isEligibleProfile(profiles[index]?.profile, profiles[index]?.status),
  ).length
}

function isLegalProfile(profile: string): boolean {
  return (
    profile === CollaboratorProfile.Lawyer ||
    profile === CollaboratorProfile.Paralegal ||
    profile === CollaboratorProfile.Supervisor
  )
}

function isEligibleProfile(profile?: string, status?: string): boolean {
  return status === UserStatus.Active && Boolean(profile && isLegalProfile(profile))
}
