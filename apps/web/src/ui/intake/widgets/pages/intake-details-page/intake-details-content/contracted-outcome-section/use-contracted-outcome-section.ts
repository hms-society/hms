import type { IntakeDetailsData } from '@/ui/intake/hooks/use-intake-details-query'

export type ContractedOutcomeSectionProps = {
  intake: IntakeDetailsData['intake']
  formalization?: IntakeDetailsData['formalizationCompletion']
  legalCase?: IntakeDetailsData['legalCase']
  legalAreaName?: string
  primaryLawyerName?: string
  isFormalizationUnavailable: boolean
  isCaseUnavailable: boolean
  onRetryFormalization: () => void
  onRetryCase: () => void
}

export function useContractedOutcomeSection(props: ContractedOutcomeSectionProps) {
  return {
    ...props,
    sectionLabel: `Desfecho do Intake ${props.intake.sequenceNumber}`,
  }
}
