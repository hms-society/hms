export const FormalizationStatus = {
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const

export type FormalizationStatus =
  (typeof FormalizationStatus)[keyof typeof FormalizationStatus]
