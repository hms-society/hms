import { useState } from 'react'
import { useClientDetailsQuery } from '@/ui/identity/hooks/use-client-details-query'
import { useClientIntakesQuery } from '@/ui/identity/hooks/use-client-intakes-query'
import { useMaskPhone } from '@/ui/shared/hooks/use-mask-phone'
import { useMaskTaxId } from '@/ui/shared/hooks/use-mask-tax-id'

export type ClientDetailsPageProps = {
  clientId: string
}

export function useClientDetailsPage({ clientId }: ClientDetailsPageProps) {
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()
  const [activeTab, setActiveTab] = useState('comunicacoes')

  const {
    clientDetails: clientData,
    clientDetailsError: clientError,
    isLoadingClientDetails: isLoadingClient,
  } = useClientDetailsQuery(clientId)
  const { clientIntakes: intakesData, isLoadingClientIntakes: isLoadingIntakes } =
    useClientIntakesQuery(clientId, {
      enabled: !!clientData,
      throwOnFailure: false,
    })

  function getInitials(name: string) {
    if (!name) return 'UN'
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  function handleTabChange(value: string) {
    setActiveTab(value)
  }

  if (isLoadingClient || isLoadingIntakes) {
    return {
      activeTab,
      clientData: undefined,
      clientError,
      handleTabChange,
      intakes: [],
      isLoading: true,
      maskPhone,
      maskTaxId,
    }
  }

  if (clientError || !clientData) {
    return {
      activeTab,
      clientData: undefined,
      clientError,
      handleTabChange,
      intakes: [],
      isLoading: false,
      maskPhone,
      maskTaxId,
    }
  }

  const { client, consents } = clientData
  const intakes = intakesData || []
  const displayName =
    client.type === 'natural' ? client.name : client.tradeName || client.legalName
  const initials = getInitials(displayName || 'UN')
  const status =
    intakes.length > 1 ? 'Cliente' : intakes.length === 1 ? 'Interessado' : 'Potencial'
  const statusStyles: Record<string, { badge: string; avatar: string; text: string }> = {
    Cliente: {
      badge: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      avatar: 'bg-emerald-100',
      text: 'text-emerald-800',
    },
    Interessado: {
      badge: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
      avatar: 'bg-amber-100',
      text: 'text-amber-800',
    },
    Potencial: {
      badge: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      avatar: 'bg-purple-100',
      text: 'text-purple-800',
    },
  }

  return {
    activeTab,
    clientData,
    clientError,
    consents,
    currentStyle: statusStyles[status] || statusStyles.Potencial,
    displayName,
    handleTabChange,
    initials,
    intakes,
    isLoading: false,
    maskPhone,
    maskTaxId,
    status,
  }
}
