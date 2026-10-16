/** @deprecated Legacy pipeline status. Use lifecycleStatus and workflowStage. */
export const LegalCaseStatus = {
  Documentation: 'documentation',
  ReadyForLegalProduction: 'ready_for_legal_production',
  LegalProduction: 'legal_production',
  ProtocolDelivery: 'protocol_delivery',
  Execution: 'execution',
  Closed: 'closed',
} as const

export type LegalCaseStatus = (typeof LegalCaseStatus)[keyof typeof LegalCaseStatus]

export const LegalCaseLifecycleStatus = {
  Active: 'active',
  Closed: 'closed',
} as const

export type LegalCaseLifecycleStatus =
  (typeof LegalCaseLifecycleStatus)[keyof typeof LegalCaseLifecycleStatus]

export const LegalCaseWorkflowStage = {
  Documentation: LegalCaseStatus.Documentation,
  ReadyForLegalProduction: LegalCaseStatus.ReadyForLegalProduction,
  LegalProduction: LegalCaseStatus.LegalProduction,
  ProtocolDelivery: LegalCaseStatus.ProtocolDelivery,
  Execution: LegalCaseStatus.Execution,
} as const

export type LegalCaseWorkflowStage =
  (typeof LegalCaseWorkflowStage)[keyof typeof LegalCaseWorkflowStage]
