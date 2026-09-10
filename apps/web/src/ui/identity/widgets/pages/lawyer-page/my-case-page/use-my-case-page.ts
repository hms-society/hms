import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useCaseChecklist } from './hooks/use-case-checklist'

export type UseMyCasePageParams = {
  caseId?: string
}

export function useMyCasePage({ caseId }: UseMyCasePageParams) {
  const caseUuid = caseId ?? '00000000-0000-4000-8000-000000000089'
  const { caseManagementService } = useRestContext()

  const caseQuery = useQuery({
    queryKey: ['case-details', caseUuid],
    queryFn: async () => {
      const res = await caseManagementService.getLegalCaseDetails(caseUuid)
      if (res.isFailure) throw new Error('Falha ao buscar detalhes do caso')
      return res.body
    },
    enabled: !!caseUuid,
  })

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
