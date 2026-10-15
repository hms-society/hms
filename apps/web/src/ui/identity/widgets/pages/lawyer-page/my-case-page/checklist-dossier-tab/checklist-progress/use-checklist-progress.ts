import type { ChecklistTabState } from '../types'

export function useChecklistProgress(state: ChecklistTabState) {
  function getChecklistProgress(state: ChecklistTabState) {
    return state.mandatoryItemsCount
      ? Math.round((state.validatedItemsCount / state.mandatoryItemsCount) * 100)
      : 0
  }
  return { progress: getChecklistProgress(state) }
}
