export const ConsultationStatus = {
  Pending: 'pending',
  Completed: 'completed',
  NoShow: 'no_show',
} as const

export type ConsultationStatus =
  (typeof ConsultationStatus)[keyof typeof ConsultationStatus]
