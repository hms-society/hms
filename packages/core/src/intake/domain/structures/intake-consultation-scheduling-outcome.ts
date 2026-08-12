export const IntakeConsultationSchedulingOutcome = {
  Scheduled: 'scheduled',
  Failed: 'failed',
} as const

export type IntakeConsultationSchedulingOutcome =
  (typeof IntakeConsultationSchedulingOutcome)[keyof typeof IntakeConsultationSchedulingOutcome]
