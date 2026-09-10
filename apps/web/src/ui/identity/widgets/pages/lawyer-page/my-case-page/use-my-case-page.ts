import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useCaseChecklist } from './hooks/use-case-checklist'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type UseMyCasePageParams = {
  caseId?: string
}

export function useMyCasePage({ caseId }: UseMyCasePageParams) {
  const { caseManagementService } = useRestContext()
  const caseUuid = caseId ?? '00000000-0000-4000-8000-000000000089'
  const [activeTab, setActiveTab] = useState('visao-geral')
  const { data: legalCases = [] } = useQuery({
    queryKey: ['case-management', 'my-cases'],
    queryFn: async () => {
      const response = await caseManagementService.listMyCases()

      if (response.isFailure) response.throwError()

      return response.body
    },
  })
  const legalCase = legalCases.find((caseItem) => caseItem.id === caseUuid)
  const displayCaseId = legalCase?.publicCode ?? 'CASO-20260703-0089'
  const caseTitle = legalCase?.title ?? 'Aposentadoria por Tempo de Contribuição'
  const caseLegalArea = legalCase?.legalArea ?? 'Área jurídica do checklist'
  const caseClientName = legalCase?.clientName ?? 'Antônio Carvalho'
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
    caseClientName,
    caseLegalArea,
    caseTitle,
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
