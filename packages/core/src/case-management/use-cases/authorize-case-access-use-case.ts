import type { UseCase } from '#shared/interfaces/use-case'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { LegalCaseNotFoundError } from '../domain/errors'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { CaseAccessIntent, CaseMemberRole, LegalCaseStatus } from '../domain/structures'
import type { CaseAccessIntent as CaseAccessIntentType } from '../domain/structures'
import type {
  CaseCollaboratorsProvider,
  CaseMembersRepository,
  LegalCasesRepository,
} from '../interfaces'
import type { CaseMember } from '../domain/entities'
import { isEligibleCaseCollaborator } from './case-team-mutation-helpers'

export type AuthorizeCaseAccessRequest = {
  caseId: string
  actorId: string
  intent: CaseAccessIntentType
  expectedClientId?: string
}

export class AuthorizeCaseAccessUseCase
  implements UseCase<AuthorizeCaseAccessRequest, void>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
    private readonly caseCollaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  async execute(request: AuthorizeCaseAccessRequest): Promise<void> {
    return authorizeCaseRequest(
      {
        legalCasesRepository: this.legalCasesRepository,
        caseMembersRepository: this.caseMembersRepository,
        caseCollaboratorsProvider: this.caseCollaboratorsProvider,
      },
      request,
    )
  }
}

type CaseAccessDependencies = {
  legalCasesRepository: LegalCasesRepository
  caseMembersRepository: CaseMembersRepository
  caseCollaboratorsProvider: CaseCollaboratorsProvider
}

async function authorizeCaseRequest(
  dependencies: CaseAccessDependencies,
  request: AuthorizeCaseAccessRequest,
): Promise<void> {
  const { legalCase, actor } = await loadCaseAccessContext(dependencies, request)
  if (isAdminRead(actor.profile, request.intent)) return
  await authorizeMemberIntent(dependencies, request, legalCase, actor.profile)
  ensureExpectedClientMatchesCase(request, legalCase.clientId)
}

function ensureExpectedClientMatchesCase(
  request: AuthorizeCaseAccessRequest,
  caseClientId: string,
) {
  if (request.expectedClientId && request.expectedClientId !== caseClientId) {
    throw new ForbiddenError('O documento não pertence ao cliente do Caso.')
  }
}

async function loadCaseAccessContext(
  dependencies: CaseAccessDependencies,
  request: AuthorizeCaseAccessRequest,
) {
  const legalCase = await findLegalCase(dependencies.legalCasesRepository, request.caseId)
  const actor = await findActiveActor(
    dependencies.caseCollaboratorsProvider,
    request.actorId,
  )
  return { legalCase, actor }
}

function authorizeMemberIntent(
  dependencies: CaseAccessDependencies,
  request: AuthorizeCaseAccessRequest,
  legalCase: Awaited<ReturnType<typeof findLegalCase>>,
  profile: string,
): Promise<void> {
  return findCurrentMember(dependencies, request).then((member) =>
    assertMemberIntent(member, profile, legalCase, request),
  )
}

function findCurrentMember(
  dependencies: CaseAccessDependencies,
  request: AuthorizeCaseAccessRequest,
) {
  return dependencies.caseMembersRepository.findByCaseAndCollaborator(
    request.caseId,
    request.actorId,
  )
}

function assertMemberIntent(
  member: Awaited<ReturnType<typeof findCurrentMember>>,
  profile: string,
  legalCase: Awaited<ReturnType<typeof findLegalCase>>,
  request: AuthorizeCaseAccessRequest,
): void {
  ensureActorCanAccessCase(profile, member, request)
  ensureIntentRole(request.intent, member.role)
  ensureCaseIsWritable(request.intent, legalCase.status)
}

async function findLegalCase(repository: LegalCasesRepository, caseId: string) {
  const legalCase = await repository.findById(caseId)
  if (!legalCase) throw new LegalCaseNotFoundError()
  return legalCase
}

async function findActiveActor(provider: CaseCollaboratorsProvider, actorId: string) {
  const actor = await provider.findById(actorId)
  if (!actor || actor.status !== UserStatus.Active) {
    throw new ForbiddenError('Acesso jurídico ao Caso não autorizado.')
  }
  return actor
}

function isAdminRead(profile: string, intent: CaseAccessIntentType): boolean {
  return profile === CollaboratorProfile.Admin && intent === CaseAccessIntent.ReadContent
}

function ensureActorCanAccessCase(
  profile: string,
  member: CaseMember | undefined,
  request: AuthorizeCaseAccessRequest,
): asserts member is CaseMember {
  requireActiveLegalMember(profile, member, request)
}

function requireActiveLegalMember(
  profile: string,
  member: CaseMember | undefined,
  request: AuthorizeCaseAccessRequest,
): CaseMember {
  if (
    !isEligibleCaseCollaborator(profile, UserStatus.Active) ||
    !isCurrentCaseMember(member, request)
  ) {
    throw new ForbiddenError('Acesso jurídico ao Caso não autorizado.')
  }
  return member
}

function isCurrentCaseMember(
  member: CaseMember | undefined,
  request: AuthorizeCaseAccessRequest,
): member is CaseMember {
  return Boolean(member && matchesRequest(member, request) && isActiveMember(member))
}

function matchesRequest(
  member: CaseMember,
  request: AuthorizeCaseAccessRequest,
): boolean {
  return member.caseId === request.caseId && member.collaboratorId === request.actorId
}

function isActiveMember(member: CaseMember): boolean {
  return !member.removedAt && !member.archivedLegacy
}

function ensureIntentRole(intent: CaseAccessIntentType, role: CaseMemberRole): void {
  const teamIntent =
    intent === CaseAccessIntent.ManageTeam ||
    intent === CaseAccessIntent.ManageDocumentException
  if (teamIntent && role !== CaseMemberRole.Manager) {
    throw new ForbiddenError('Somente o Gestor do Caso pode executar esta ação.')
  }
}

function ensureCaseIsWritable(
  intent: CaseAccessIntentType,
  status: LegalCaseStatus,
): void {
  if (intent !== CaseAccessIntent.ReadContent && status === LegalCaseStatus.Closed) {
    throw new ForbiddenError('Casos encerrados permitem apenas leitura.')
  }
}
