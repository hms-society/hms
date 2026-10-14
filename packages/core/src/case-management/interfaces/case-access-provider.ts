import type { CaseAccessIntent } from '../domain/structures'

export interface CaseAccessProvider {
  authorize(params: {
    caseId: string
    actorId: string
    intent: CaseAccessIntent
    expectedClientId?: string
  }): Promise<void>
}
