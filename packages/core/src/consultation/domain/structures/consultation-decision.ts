export const ConsultationDecision = {
  ProceedToContracting: 'Prosseguir para contratação',
  NewConsultation: 'Nova consulta',
  CloseWithoutContract: 'Encerrar sem contratação',
} as const

export type ConsultationDecision =
  (typeof ConsultationDecision)[keyof typeof ConsultationDecision]
