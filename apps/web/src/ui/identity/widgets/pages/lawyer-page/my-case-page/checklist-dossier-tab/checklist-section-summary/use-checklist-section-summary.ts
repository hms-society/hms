import type { ChecklistTabState } from '../types'
import { CHECKLIST_SECTION_STATUSES } from '../checklist-section-statuses'

export function useChecklistSectionSummary(state: ChecklistTabState) {
  function getChecklistSectionStatus(state: ChecklistTabState) {
    if (state.isChecklistComplete) {
      return CHECKLIST_SECTION_STATUSES.complete
    }

    if (state.mandatoryItemsCount > 0) return CHECKLIST_SECTION_STATUSES.partial

    return CHECKLIST_SECTION_STATUSES.empty
  }
  return { status: getChecklistSectionStatus(state) }
}
