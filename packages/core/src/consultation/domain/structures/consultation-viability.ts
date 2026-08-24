export const ConsultationViability = {
  Viable: 'Viável',
  ViableWithReservations: 'Viável com ressalvas',
  NotViable: 'Inviável',
} as const

export type ConsultationViability =
  (typeof ConsultationViability)[keyof typeof ConsultationViability]
