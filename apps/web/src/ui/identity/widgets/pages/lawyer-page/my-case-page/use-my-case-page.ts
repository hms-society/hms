import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useCaseChecklist } from './hooks/use-case-checklist'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type UseMyCasePageParams = {
  caseId?: string
}

export function useMyCasePage({ caseId }: UseMyCasePageParams) {
  const { caseManagementService } = useRestContext()
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
