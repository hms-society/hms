import { useState } from 'react'

import { useCaseChecklist } from './hooks/use-case-checklist'

export type UseMyCasePageParams = {
  caseId?: string
}

export function useMyCasePage({ caseId }: UseMyCasePageParams) {
  const caseUuid = caseId ?? '00000000-0000-4000-8000-000000000089'
  const displayCaseId = 'CASO-20260703-0089'
  const [activeTab, setActiveTab] = useState('visao-geral')
  const {
    checklistItems,
    completionPercentage,
    mandatoryItemsCount,
    pendingItemsCount,
    validatedItemsCount,
  } = useCaseChecklist({ caseId: caseUuid })

  function handleOpenChecklistTab() {
    setActiveTab('checklist')
  }

  return {
    activeTab,
    caseUuid,
    checklistItems,
    completionPercentage,
    displayCaseId,
    mandatoryItemsCount,
    pendingItemsCount,
    validatedItemsCount,
    handleOpenChecklistTab,
    setActiveTab,
  }
}
