export const IntakeDecision = {
  ScheduleConsultation: 'schedule_consultation',
  RegisterIntake: 'register_intake',
  CloseWithoutContract: 'close_without_contract',
} as const

export type IntakeDecision = (typeof IntakeDecision)[keyof typeof IntakeDecision]
