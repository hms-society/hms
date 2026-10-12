import type { CaseEligibleCollaborator } from './case-eligible-collaborator'

export type CaseOpeningSource = {
  intakeId: string
  suggestedManager?: CaseEligibleCollaborator
}
