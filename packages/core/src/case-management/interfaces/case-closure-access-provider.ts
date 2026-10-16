import type { CaseClosureActorAccess } from '../domain/structures/case-closure-actor-access'

export interface CaseClosureAccessProvider {
  getActorAccess(caseId: string, actorId: string): Promise<CaseClosureActorAccess>
}
