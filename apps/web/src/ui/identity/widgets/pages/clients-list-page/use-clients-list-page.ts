import { useState, type MouseEvent } from 'react'

import type { ClientDetails } from '@hms/core/identity/domain/entities'

import { useClientsQuery } from '@/ui/identity/hooks/use-clients-query'
import { useMaskPhone } from '@/ui/shared/hooks/use-mask-phone'
import { useMaskTaxId } from '@/ui/shared/hooks/use-mask-tax-id'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

type ClientStatus = 'Cliente' | 'Interessado' | 'Potencial'

const CLIENT_STATUS_STYLES: Record<ClientStatus, { badge: string; avatar: string }> = {
  Cliente: {
    badge: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    avatar: 'bg-emerald-100 text-emerald-800',
  },
  Interessado: {
    badge: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    avatar: 'bg-amber-100 text-amber-800',
  },
  Potencial: {
    badge: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    avatar: 'bg-purple-100 text-purple-800',
  },
}

const CLIENT_ORIGIN_LABELS: Record<string, string> = {
  direct: 'Direta HMS',
  referral: 'Indicação',
  website: 'Site',
  social_media: 'Redes sociais',
  other: 'Outro',
}

export function useClientsListPage() {
  const { navigateTo } = useNavigation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('status')
  const [origin, setOrigin] = useState('origem')
  const [responsavel, setResponsavel] = useState('responsavel')
  const [isClientRegisterDialogOpen, setIsClientRegisterDialogOpen] = useState(false)
  const limit = 20

  const { clientsPage, isLoadingClients } = useClientsQuery({ page, limit, search })
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()

  const backendClients = clientsPage?.data ?? []
  const total = clientsPage?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  function getInitials(name: string) {
    if (!name) return 'UN'
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  const filteredClients = backendClients.filter((item: any) => {
    const client = item.client || item
    const itemStatus = client.status || 'Cliente'
    const matchesStatus = status === 'status' || itemStatus.toLowerCase() === status

    const itemOrigin = item.latestOrigin || client.origin || 'direct'
    const clientOriginLabel =
      CLIENT_ORIGIN_LABELS[itemOrigin] || itemOrigin || 'Direta HMS'

    const matchesOrigin =
      origin === 'origem' ||
      (origin === 'direta' && clientOriginLabel === 'Direta HMS') ||
      (origin === 'indicação' && clientOriginLabel === 'Indicação') ||
      (origin === 'campanha' && clientOriginLabel === 'Campanha') ||
      (origin === 'outro' && clientOriginLabel === 'Outro')

    return matchesStatus && matchesOrigin
  })

  function handlePreviousPage(event: MouseEvent) {
    event.preventDefault()
    if (page > 1) setPage((currentPage) => currentPage - 1)
  }

  function handleNextPage(event: MouseEvent) {
    event.preventDefault()
    if (page < totalPages) setPage((currentPage) => currentPage + 1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setStatus(value)
  }

  function handleOriginChange(value: string) {
    setOrigin(value)
  }

  function handleResponsibleChange(value: string) {
    setResponsavel(value)
  }

  function handleClientSelect(clientId: string) {
    void navigateTo('clientDetails', { params: { clienteId: clientId } })
  }

  function handleOpenClientRegisterDialog() {
    setIsClientRegisterDialogOpen(true)
  }

  function handleClientRegisterDialogOpenChange(open: boolean) {
    setIsClientRegisterDialogOpen(open)
  }

  function handleClientSelected(clientDetails: ClientDetails) {
    setIsClientRegisterDialogOpen(false)
    handleClientSelect(clientDetails.client.id)
  }

  const clients = filteredClients.map((item: any) => {
    const client = item.client || item
    const displayName = client.name || client.legalName || 'Nome não informado'
    const clientStatus = client.status || 'Cliente'
    const statusStyle =
      CLIENT_STATUS_STYLES[clientStatus as keyof typeof CLIENT_STATUS_STYLES] ||
      CLIENT_STATUS_STYLES.Potencial
    const itemOrigin = item.latestOrigin || client.origin || 'direct'

    return {
      client,
      clientStatus,
      displayName,
      displayOrigin: CLIENT_ORIGIN_LABELS[itemOrigin] || itemOrigin || 'Direta HMS',
      initials: getInitials(displayName),
      intakesCount: item.intakeCount || client.intakesCount || 0,
      statusStyle,
    }
  })

  return {
    clients,
    handleClientRegisterDialogOpenChange,
    handleClientSelect,
    handleClientSelected,
    handleNextPage,
    handleOriginChange,
    handleOpenClientRegisterDialog,
    handlePreviousPage,
    handleResponsibleChange,
    handleSearchChange,
    handleStatusChange,
    isClientRegisterDialogOpen,
    isLoading: isLoadingClients,
    limit,
    maskPhone,
    maskTaxId,
    origin,
    page,
    responsavel,
    search,
    status,
    total,
    totalPages,
  }
}
