export const IntakeStatus = {
  Registered: 'registered',
  ConsultationScheduling: 'consultation_scheduling',
  ConsultationSchedulingFailed: 'consultation_scheduling_failed',
  ConsultationScheduled: 'consultation_scheduled',
  ConsultationCompleted: 'consultation_completed',
  ViabilityRegistered: 'viability_registered',
  InFormalization: 'in_formalization',
  Contracted: 'contracted',
  ClosedWithoutContract: 'closed_without_contract',
} as const

export type IntakeStatus = (typeof IntakeStatus)[keyof typeof IntakeStatus]
