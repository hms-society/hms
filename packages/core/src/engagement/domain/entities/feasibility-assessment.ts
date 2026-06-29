import type { FeasibilityResult } from '../structures'

export type FeasibilityAssessment = {
  id: string
  intakeId: string
  result: FeasibilityResult
  justification: string
  infeasibilityReason?: string
  basedOnConsultationId?: string
  assessedByUserId: string
  assessedAt: Date
}
