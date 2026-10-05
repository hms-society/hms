import type { ThirdPartyStatus } from '@hms/core/identity/domain/structures'
import { useMemo, useState } from 'react'

import { useThirdPartiesQuery } from '@/ui/identity/hooks/use-third-parties-query'
import { useUpdateThirdPartyStatusAction } from '@/ui/identity/hooks/use-update-third-party-status-action'

import type { ThirdParty } from '@hms/core/identity/domain/entities'

export type ThirdPartyStatusAction = {
  kind: 'deactivate' | 'reactivate'
  thirdParty: ThirdParty
}

export function useThirdPartiesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | ThirdPartyStatus>('all')
  const [selectedAction, setSelectedAction] = useState<ThirdPartyStatusAction>()
  const [selectedEditThirdParty, setSelectedEditThirdParty] = useState<ThirdParty>()
  const { thirdParties, thirdPartiesError, isLoadingThirdParties, refetch } =
    useThirdPartiesQuery()
  const {
    updateThirdPartyStatus,
    updateThirdPartyStatusError,
    isUpdatingThirdPartyStatus,
  } = useUpdateThirdPartyStatusAction()
  const filteredThirdParties = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return thirdParties.filter((thirdParty) => {
      const name =
        `${thirdParty.tradeName ?? ''} ${thirdParty.legalName}`.toLocaleLowerCase()
      return (
        (!normalizedSearch ||
          name.includes(normalizedSearch) ||
          thirdParty.taxId.value.toLocaleLowerCase().includes(normalizedSearch)) &&
        (status === 'all' || thirdParty.status === status)
      )
    })
  }, [search, status, thirdParties])

  function getTypeLabel(type: string) {
    return (
      (
        {
          union: 'Sindicato',
          association: 'Associação',
          partner_company: 'Empresa parceira',
          institutional_partner: 'Parceiro institucional',
          other: 'Outro',
        } as Record<string, string>
      )[type] ?? type
    )
  }

  function getRelationshipLabels(types: readonly string[]) {
    const labels: Record<string, string> = {
      demand_origin: 'Origem da demanda',
      payer: 'Pagador',
      representative_partner: 'Representante/parceiro',
      document_supporter: 'Apoiador documental',
      contractor: 'Contratante',
      other: 'Outro',
    }
    return types.map((type) => labels[type] ?? type)
  }

  function handleActionDialogOpenChange(open: boolean) {
    if (!open && !isUpdatingThirdPartyStatus) setSelectedAction(undefined)
  }

  async function handleConfirmAction() {
    if (!selectedAction) return
    await updateThirdPartyStatus({
      action: selectedAction.kind,
      thirdPartyId: selectedAction.thirdParty.id,
    })
    setSelectedAction(undefined)
  }

  return {
    filteredThirdParties,
    handleActionDialogOpenChange,
    handleConfirmAction,
    getRelationshipLabels,
    getTypeLabel,
    isLoadingThirdParties,
    isUpdatingThirdPartyStatus,
    refetch,
    search,
    setSearch,
    setStatus,
    status,
    selectedAction,
    selectedEditThirdParty,
    setSelectedEditThirdParty,
    setSelectedAction,
    updateThirdPartyStatusError,
    thirdPartiesError,
  }
}
