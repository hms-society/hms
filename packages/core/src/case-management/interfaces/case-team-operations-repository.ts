import type { CaseTeamOperation, CaseTeamOperationCreation } from '../domain/entities'

export interface CaseTeamOperationsRepository {
  findByKey(caseId: string, actorId: string, operationId: string): Promise<CaseTeamOperation | undefined>
  add(input: CaseTeamOperationCreation): Promise<CaseTeamOperation>
  removeAll(): Promise<void>
}
