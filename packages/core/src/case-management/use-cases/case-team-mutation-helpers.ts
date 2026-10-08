import { ConflictError } from '#shared/domain/errors/conflict-error'
import { BadRequestError } from '#shared/domain/errors/bad-request-error'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import type { CaseMember } from '../domain/entities'
import type { CaseTeamMutationResult } from '../domain/structures'
import {
  CaseTeamRole,
  type CaseTeamHistoryKind,
  LegalCaseStatus,
} from '../domain/structures'
import type { CaseTeamMutationRequest } from './case-team-mutation-request'
import type { CaseTeamScope } from '../interfaces/case-team-scope'

export type CaseTeamMutationContext = {
  fingerprint: string
  isAdmin: boolean
  reason?: string
}

export type CaseTeamMutationPreparation =
  | { replay: CaseTeamMutationResult }
  | { context: CaseTeamMutationContext }

type CaseTeamMutationAction = 'add' | 'change_role' | 'remove'
type CaseTeamHistoryInput = {
  kind: CaseTeamHistoryKind
  occurredAt: Date
  previousRole?: CaseMember['role']
  nextRole?: CaseMember['role']
}
type CaseTeamHistoryWrite = {
  scope: CaseTeamScope
  request: CaseTeamMutationRequest
  context: CaseTeamMutationContext
  membership: CaseMember
  input: CaseTeamHistoryInput
  teamVersion: number
}
type CaseTeamMutationPersistence = {
  scope: CaseTeamScope
  request: CaseTeamMutationRequest
  context: CaseTeamMutationContext
  membership: CaseMember
  teamVersion: number
  historyId: string
  createdAt: Date
}
type CaseTeamReplayWrite = {
  scope: CaseTeamScope
  request: CaseTeamMutationRequest
  context: CaseTeamMutationContext
  result: CaseTeamMutationResult
  createdAt: Date
}

export function isEligibleCaseCollaborator(profile: string, status: string): boolean {
  return (
    status === UserStatus.Active &&
    (profile === CollaboratorProfile.Lawyer ||
      profile === CollaboratorProfile.Paralegal ||
      profile === CollaboratorProfile.Supervisor)
  )
}

export async function prepareCaseTeamMutation(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  action: CaseTeamMutationAction,
  fingerprintFields: Record<string, unknown>,
): Promise<CaseTeamMutationPreparation> {
  const legalCase = await requireCase(scope, request)
  return prepareExistingCaseMutation(scope, request, legalCase, action, fingerprintFields)
}

async function prepareExistingCaseMutation(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  legalCase: NonNullable<
    Awaited<ReturnType<CaseTeamScope['legalCasesRepository']['findById']>>
  >,
  action: CaseTeamMutationAction,
  fields: Record<string, unknown>,
): Promise<CaseTeamMutationPreparation> {
  return authorizeCaseTeamMutation(scope, request, legalCase.status, action).then(
    (authorization) =>
      resolveMutationReplay(
        scope,
        request,
        legalCase,
        buildMutationContext(action, fields, request.expectedTeamVersion, authorization),
      ),
  )
}

function buildMutationContext(
  action: CaseTeamMutationAction,
  fields: Record<string, unknown>,
  expectedTeamVersion: number,
  authorization: { isAdmin: boolean; reason?: string },
): CaseTeamMutationContext {
  const { isAdmin, reason } = authorization
  return {
    fingerprint: JSON.stringify({ action, ...fields, reason, expectedTeamVersion }),
    isAdmin,
    reason,
  }
}

async function requireCase(scope: CaseTeamScope, request: CaseTeamMutationRequest) {
  const legalCase = await scope.legalCasesRepository.findById(request.caseId)
  if (!legalCase) throw new NotFoundError('O Caso não foi encontrado.')
  return legalCase
}

async function resolveMutationReplay(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  legalCase: NonNullable<
    Awaited<ReturnType<CaseTeamScope['legalCasesRepository']['findById']>>
  >,
  context: CaseTeamMutationContext,
): Promise<CaseTeamMutationPreparation> {
  const replay = await findReplay(scope, request, context.fingerprint)
  if (replay) return { replay }
  if ((legalCase.teamVersion ?? 0) !== request.expectedTeamVersion) {
    throw new ConflictError('A equipe mudou. Atualize e confirme novamente.')
  }
  return { context }
}

async function authorizeCaseTeamMutation(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  caseStatus: LegalCaseStatus,
  action: CaseTeamMutationAction,
): Promise<{ isAdmin: boolean; reason?: string }> {
  const actor = await requireActiveActor(scope, request)
  return authorizeActorMutation(scope, request, caseStatus, action, actor.profile)
}

async function authorizeActorMutation(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  caseStatus: LegalCaseStatus,
  action: CaseTeamMutationAction,
  profile: string,
): Promise<{ isAdmin: boolean; reason?: string }> {
  const isAdmin = profile === CollaboratorProfile.Admin
  const reason = request.reason?.trim() || undefined
  return authorizeMutation(scope, request, caseStatus, action, profile, isAdmin, reason)
}

async function authorizeMutation(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  caseStatus: LegalCaseStatus,
  action: CaseTeamMutationAction,
  profile: string,
  isAdmin: boolean,
  reason?: string,
): Promise<{ isAdmin: boolean; reason?: string }> {
  if (!isAdmin) await ensureActorIsManager(scope, request, profile)
  ensureCaseTeamIsWritable(caseStatus)
  ensureAdminRemovalHasReason(isAdmin, action, reason)
  return { isAdmin, reason }
}

async function requireActiveActor(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
) {
  const actor = await scope.caseCollaboratorsProvider.findById(request.actorId)
  if (!actor || actor.status !== UserStatus.Active)
    throw new ForbiddenError('Ação não autorizada.')
  return actor
}

async function ensureActorIsManager(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  profile: string,
): Promise<void> {
  if (!(await isAuthorizedManager(scope, request, profile))) {
    throw new ForbiddenError(
      'Somente o Gestor elegível do Caso pode administrar a equipe.',
    )
  }
}

async function isAuthorizedManager(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  profile: string,
): Promise<boolean> {
  return (
    isEligibleCaseCollaborator(profile, UserStatus.Active) &&
    (await findActiveManager(scope, request))
  )
}

async function findActiveManager(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
): Promise<boolean> {
  return scope.caseMembersRepository
    .findByCaseAndCollaborator(request.caseId, request.actorId)
    .then(isActiveManager)
}

function isActiveManager(member: CaseMember | undefined): boolean {
  return Boolean(
    member &&
      !member.removedAt &&
      !member.archivedLegacy &&
      member.role === CaseTeamRole.Manager,
  )
}

function ensureCaseTeamIsWritable(status: LegalCaseStatus): void {
  if (status === LegalCaseStatus.Closed) {
    throw new ForbiddenError('Casos encerrados permitem apenas leitura.')
  }
}

function ensureAdminRemovalHasReason(
  isAdmin: boolean,
  action: CaseTeamMutationAction,
  reason: string | undefined,
): void {
  if (isAdmin && action === 'remove' && !reason) {
    throw new BadRequestError('A justificativa administrativa é obrigatória.')
  }
}

async function findReplay(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  fingerprint: string,
): Promise<CaseTeamMutationResult | undefined> {
  const previous = await scope.caseTeamOperationsRepository.findByKey(
    request.caseId,
    request.actorId,
    request.operationId,
  )
  return resolveReplay(previous, fingerprint)
}

function resolveReplay(
  previous: Awaited<
    ReturnType<CaseTeamScope['caseTeamOperationsRepository']['findByKey']>
  >,
  fingerprint: string,
): CaseTeamMutationResult | undefined {
  if (!previous) return undefined
  ensureFingerprintMatches(previous.fingerprint, fingerprint)
  return previous.result
}

function ensureFingerprintMatches(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new ConflictError('A chave da operação já foi usada com outro conteúdo.')
  }
}

export async function recordCaseTeamMutation(
  scope: CaseTeamScope,
  request: CaseTeamMutationRequest,
  context: CaseTeamMutationContext,
  membership: CaseMember,
  input: CaseTeamHistoryInput,
): Promise<CaseTeamMutationResult> {
  const teamVersion = await scope.legalCasesRepository.replaceTeamVersion(
    request.caseId,
    request.expectedTeamVersion,
  )
  return writeMutationOutcome({ scope, request, context, membership, input, teamVersion })
}

async function writeMutationOutcome(
  write: CaseTeamHistoryWrite,
): Promise<CaseTeamMutationResult> {
  return writeCaseTeamHistory(write).then(({ id }) =>
    persistMutationReplay({ ...write, historyId: id, createdAt: write.input.occurredAt }),
  )
}

function persistMutationReplay(
  write: CaseTeamMutationPersistence,
): Promise<CaseTeamMutationResult> {
  const result = mutationRecord(write.request.caseId, {
    membershipId: write.membership.id,
    teamVersion: write.teamVersion,
    historyId: write.historyId,
  })
  return recordMutationReplay({ ...write, result }).then(() => result)
}

function caseCaseId(caseId: string) {
  return { caseId }
}

function mutationRecord<T extends object>(caseId: string, fields: T) {
  return Object.assign(caseCaseId(caseId), fields)
}

async function writeCaseTeamHistory(write: CaseTeamHistoryWrite) {
  return write.scope.caseTeamHistoriesRepository.add(createHistoryRecord(write))
}

function createHistoryRecord({
  request,
  context,
  membership,
  input,
  teamVersion,
}: CaseTeamHistoryWrite) {
  return Object.assign(
    historyIdentity(request, membership),
    input,
    historyMutationDetails(input, teamVersion),
    historyActorDetails(request, context),
  )
}

function historyMutationDetails(input: CaseTeamHistoryInput, teamVersion: number) {
  return Object.assign(
    { teamVersion },
    { previousRole: input.previousRole, nextRole: input.nextRole },
  )
}

function historyActorDetails(
  request: CaseTeamMutationRequest,
  context: CaseTeamMutationContext,
) {
  return {
    reason: context.isAdmin ? context.reason : undefined,
    operationId: request.operationId,
  }
}

function historyIdentity(request: CaseTeamMutationRequest, membership: CaseMember) {
  return {
    caseId: request.caseId,
    membershipId: membership.id,
    collaboratorId: membership.collaboratorId,
    actorId: request.actorId,
  }
}

function recordMutationReplay(write: CaseTeamReplayWrite): Promise<void> {
  return Promise.resolve(
    write.scope.caseTeamOperationsRepository.add(
      createMutationReplay(write.request, write.context, write.result, write.createdAt),
    ),
  ).then(() => undefined)
}

function createMutationReplay(
  request: CaseTeamMutationRequest,
  context: CaseTeamMutationContext,
  result: CaseTeamMutationResult,
  createdAt: Date,
) {
  return mutationRecord(request.caseId, {
    actorId: request.actorId,
    operationId: request.operationId,
    fingerprint: context.fingerprint,
    result,
    createdAt,
  })
}
