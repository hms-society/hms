export const IntakeStatus = {
  NewRecord: 'new_record',
  InitialTriage: 'initial_triage',
  AwaitingInfo: 'awaiting_info',
  ConsultationNeeded: 'consultation_needed',
  ConsultationScheduled: 'consultation_scheduled',
  ConsultationHeld: 'consultation_held',
  InFeasibilityEvaluation: 'in_feasibility_evaluation',
  FeasibleAwaitingFormalization: 'feasible_awaiting_formalization',
  FormalizationInProgress: 'formalization_in_progress',
  Contracted: 'contracted',
  ClosedWithoutContract: 'closed_without_contract',
} as const

export type IntakeStatus = (typeof IntakeStatus)[keyof typeof IntakeStatus]
