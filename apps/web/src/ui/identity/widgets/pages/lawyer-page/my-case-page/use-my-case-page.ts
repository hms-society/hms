import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useCaseChecklist } from './hooks/use-case-checklist'

export type UseMyCasePageParams = {
  caseId?: string
}

export function useMyCasePage({ caseId }: UseMyCasePageParams) {
  const { caseManagementService, identityService } = useRestContext()
  const caseUuid = caseId ?? '00000000-0000-4000-8000-000000000089'
  const [portalAccessUrl, setPortalAccessUrl] = useState<string | null>(null)
  const [portalAccessExpiresAt, setPortalAccessExpiresAt] = useState<string | null>(null)
  const [selectedThirdPartyId, setSelectedThirdPartyId] = useState('')

  const caseQuery = useQuery({
    queryKey: ['case-details', caseUuid],
    queryFn: async () => {
      const res = await caseManagementService.getLegalCaseDetails(caseUuid)
      if (res.isFailure) throw new Error('Falha ao buscar detalhes do caso')
      return res.body
    },
    enabled: !!caseUuid,
  })

  const thirdPartiesQuery = useQuery({
    queryKey: ['third-parties', 'active'],
    queryFn: async () => {
      const response = await identityService.listThirdParties()
      if (response.isFailure) response.throwError()
      return response.body.filter((thirdParty) => thirdParty.status === 'active')
    },
  })

  const portalAccessMutation = useMutation({
    mutationFn: async () => {
      const response = await caseManagementService.grantCasePortalAccess(caseUuid, {
        canUpload: true,
        thirdPartyId: selectedThirdPartyId,
      })

      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: (access) => {
      setPortalAccessUrl(
        new URL(access.portalAccessUrl, window.location.origin).toString(),
      )
      setPortalAccessExpiresAt(access.expiresAt)
    },
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

  function handleGeneratePortalLink() {
    if (!selectedThirdPartyId) return
    return portalAccessMutation.mutateAsync()
  }

  function handleClosePortalAccessDialog() {
    setPortalAccessUrl(null)
    setPortalAccessExpiresAt(null)
  }

  async function handleCopyPortalLink() {
    if (!portalAccessUrl) return

    try {
      await navigator.clipboard.writeText(portalAccessUrl)
      toast.success('Link do portal copiado.')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
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
    handleClosePortalAccessDialog,
    handleCopyPortalLink,
    handleGeneratePortalLink,
    isGeneratingPortalLink: portalAccessMutation.isPending,
    portalAccessError: portalAccessMutation.error,
    portalAccessExpiresAt,
    portalAccessUrl,
    selectedThirdPartyId,
    setSelectedThirdPartyId,
    thirdParties: thirdPartiesQuery.data ?? [],
    setActiveTab,
  }
}
