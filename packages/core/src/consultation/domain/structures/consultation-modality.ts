export const ConsultationModality = {
  Virtual: 'virtual',
  InPerson: 'in_person',
} as const

export type ConsultationModality =
  (typeof ConsultationModality)[keyof typeof ConsultationModality]
