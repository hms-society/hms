export const LegalCaseStatus = {
  Documentation: 'documentation',
  LegalProduction: 'legal_production',
  ProtocolDelivery: 'protocol_delivery',
  Execution: 'execution',
  Closed: 'closed',
} as const

export type LegalCaseStatus = (typeof LegalCaseStatus)[keyof typeof LegalCaseStatus]
