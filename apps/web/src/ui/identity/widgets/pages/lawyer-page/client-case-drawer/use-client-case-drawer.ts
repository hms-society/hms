import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type UseClientCaseDrawerProps = {
  clientId?: string
  clientName?: string
  open: boolean
}

export function useClientCaseDrawer({
  clientId,
  clientName,
  open,
}: UseClientCaseDrawerProps) {
  const { caseManagementService } = useRestContext()
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  const { data: allCases = [], isLoading: isLoadingCases } = useQuery({
    queryKey: ['case-management', 'my-cases'],
    queryFn: async () => {
      const response = await caseManagementService.listMyCases()
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: open,
  })

  // Filter cases matching client name or clientId
  const clientCases = allCases.filter((c) => {
    if (!clientName) return true
    return (
      c.clientName.toLowerCase().trim() === clientName.toLowerCase().trim() ||
      (clientId && (c as any).clientId === clientId)
    )
  })

  useEffect(() => {
    if (clientCases.length > 0 && !selectedCaseId) {
      setSelectedCaseId(clientCases[0].id)
    } else if (clientCases.length > 0 && selectedCaseId) {
      const exists = clientCases.some((c) => c.id === selectedCaseId)
      if (!exists) {
        setSelectedCaseId(clientCases[0].id)
      }
    }
  }, [clientCases, selectedCaseId])

  const activeCaseId = selectedCaseId || clientCases[0]?.id

  const { data: activeCaseDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['case-details', activeCaseId],
    queryFn: async () => {
      if (!activeCaseId) return null
      const res = await caseManagementService.getLegalCaseDetails(activeCaseId)
      if (res.isFailure) return null
      return res.body
    },
    enabled: open && !!activeCaseId,
  })

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['case-checklist', activeCaseId],
    queryFn: async () => {
      if (!activeCaseId) return []
      const res = await caseManagementService.listCaseChecklist(activeCaseId)
      if (res.isFailure) return []
      return res.body
    },
    enabled: open && !!activeCaseId,
  })

  const totalChecklistItems = checklistItems.length
  const validatedItemsCount = checklistItems.filter(
    (item) => item.status === 'validated',
  ).length
  const pendingItemsCount = checklistItems.filter(
    (item) => item.status === 'pending',
  ).length
  const completionPercentage =
    totalChecklistItems > 0
      ? Math.round((validatedItemsCount / totalChecklistItems) * 100)
      : 0

  const activeCase = activeCaseDetails || clientCases.find((c) => c.id === activeCaseId)

  return {
    clientCases,
    activeCase,
    selectedCaseId: activeCaseId,
    setSelectedCaseId,
    isLoading: isLoadingCases || isLoadingDetails,
    checklistItems,
    completionPercentage,
    validatedItemsCount,
    pendingItemsCount,
    totalChecklistItems,
  }
}
