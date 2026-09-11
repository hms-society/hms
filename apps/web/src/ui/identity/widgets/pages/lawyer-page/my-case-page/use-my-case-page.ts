import { useState } from 'react'

import { useLegalCaseDetailsQuery } from '@/ui/case-management/hooks/use-legal-case-details-query'

import { useCaseChecklist } from './hooks/use-case-checklist'

export type UseMyCasePageParams = {
  caseId?: string
}

export function useMyCasePage({ caseId }: UseMyCasePageParams) {
  const caseUuid = caseId ?? '00000000-0000-4000-8000-000000000089'
  const caseQuery = useLegalCaseDetailsQuery(caseUuid)

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
    caseDetails: caseQuery.data,
    isLoading: caseQuery.isLoading,
    checklistItems,
    completionPercentage,
    displayCaseId: caseQuery.data?.publicCode ?? 'Carregando...',
    mandatoryItemsCount,
    pendingItemsCount,
    validatedItemsCount,
    handleOpenChecklistTab,
    setActiveTab,
  }
}
