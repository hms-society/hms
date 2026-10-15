export type CaseTeamMutationRequest = {
  caseId: string
  actorId: string
  expectedTeamVersion: number
  operationId: string
  reason?: string
}
