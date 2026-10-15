import type { ChecklistTabState } from '../types'
import { ChecklistGateSection } from '../checklist-gate-section'
import { DecisionReasonSection } from '../decision-reason-section'

export type ChecklistGateProps = {
  disabledReason?: string
  readOnly: boolean
  state: ChecklistTabState
}

export const ChecklistGate = ({
  disabledReason,
  readOnly,
  state,
}: ChecklistGateProps) => (
  <>
    <ChecklistGateSection
      disabledReason={disabledReason}
      readOnly={readOnly}
      state={state}
    />
    {!readOnly && <DecisionReasonSection state={state} />}
  </>
)
