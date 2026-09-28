import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { CASE_STAGES } from './case-page-data'
import { useCaseChecklist } from './hooks/use-case-checklist'

export type UseMyCasePageParams = {
  caseId?: string
}

export function useMyCasePage({ caseId }: UseMyCasePageParams) {
  const { caseManagementService } = useRestContext()
  const caseUuid = caseId ?? '00000000-0000-4000-8000-000000000089'
  const [portalAccessUrl, setPortalAccessUrl] = useState<string | null>(null)
  const [portalAccessExpiresAt, setPortalAccessExpiresAt] = useState<string | null>(null)

  const caseQuery = useQuery({
    queryKey: ['case-details', caseUuid],
    queryFn: async () => {
      const res = await caseManagementService.getLegalCaseDetails(caseUuid)
      if (res.isFailure) throw new Error('Falha ao buscar detalhes do caso')
      return res.body
    },
    enabled: !!caseUuid,
  })

  const portalAccessMutation = useMutation({
    mutationFn: async () => {
      const response = await caseManagementService.grantCasePortalAccess(caseUuid, {
        canUpload: true,
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
  const caseDetails = caseQuery.data
  const caseStatus =
    caseDetails?.status ?? legalCase?.status ?? LegalCaseStatus.Documentation
  const dossierApproved = Boolean(
    caseDetails?.dossierGate.homologatedAt ?? legalCase?.dossierGate.homologatedAt,
  )
  const statusPresentation = {
    [LegalCaseStatus.Documentation]: {
      label: 'Documentação em formação',
      stage: 'Documentação',
      stageStatus: 'Checklist e dossiê',
    },
    [LegalCaseStatus.ReadyForLegalProduction]: {
      label: 'Pronto para produção jurídica',
      stage: 'Produção Jurídica',
      stageStatus: 'Aguardando homologação do dossiê',
    },
    [LegalCaseStatus.LegalProduction]: {
      label: 'Produção jurídica',
      stage: 'Produção Jurídica',
      stageStatus: 'Em andamento',
    },
    [LegalCaseStatus.ProtocolDelivery]: {
      label: 'Protocolo / entrega',
      stage: 'Protocolo / Entrega',
    },
    [LegalCaseStatus.Execution]: {
      label: 'Execução',
      stage: 'Execução',
    },
    [LegalCaseStatus.Closed]: {
      label: 'Encerrado',
      stage: 'Encerramento',
    },
  }[caseStatus]
  const caseStages = CASE_STAGES.map((stage) => ({
    ...stage,
    isActive: stage.label === statusPresentation.stage,
    status:
      stage.label === statusPresentation.stage
        ? statusPresentation.stageStatus
        : undefined,
  }))
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
    caseDetails,
    caseStatusLabel: statusPresentation.label,
    caseStages,
    dossierApproved,
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
    setActiveTab,
  }
}
