export const ConsultationFormTemplateStatus = {
  Available: 'available',
  Unavailable: 'unavailable',
} as const

export type ConsultationFormTemplateStatus =
  (typeof ConsultationFormTemplateStatus)[keyof typeof ConsultationFormTemplateStatus]
