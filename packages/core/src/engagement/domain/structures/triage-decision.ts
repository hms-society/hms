export const TriageDecision = {
  ConsultationNeeded: 'consultation_needed',
  ConsultationUnnecessary: 'consultation_unnecessary',
  InfoPending: 'info_pending',
  Reschedule: 'reschedule',
  Closure: 'closure',
} as const

export type TriageDecision = (typeof TriageDecision)[keyof typeof TriageDecision]
