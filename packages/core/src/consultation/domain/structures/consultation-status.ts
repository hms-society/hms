export const ConsultationStatus = {
  Pending: 'pending',
  InProgress: 'in_progress',
  Completed: 'completed',
  NoShow: 'no_show',
} as const

export type ConsultationStatus =
  (typeof ConsultationStatus)[keyof typeof ConsultationStatus]
