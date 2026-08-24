import { useState } from 'react'

import { useClientCommunicationsQuery } from '@/ui/identity/hooks/use-client-communications-query'

export type ClientCommunicationsTabProps = {
  clientId: string
}

export function useClientCommunicationsTab({ clientId }: ClientCommunicationsTabProps) {
  const [channelFilter, setChannelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  const {
    data: communications = [],
    isLoading: isLoadingCommunications,
    isError: isErrorCommunications,
  } = useClientCommunicationsQuery(clientId)

  const filteredCommunications = communications.filter((item: any) => {
    if (channelFilter !== 'all' && item.channel !== channelFilter) return false
    if (typeFilter !== 'all' && item.direction !== typeFilter) return false

    if (periodFilter !== 'all') {
      const itemDate = new Date(item.createdAt).getTime()
      const now = Date.now()
      const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24)
      if (periodFilter === '7days' && diffDays > 7) return false
      if (periodFilter === '30days' && diffDays > 30) return false
      if (periodFilter === '6months' && diffDays > 180) return false
      if (periodFilter === '1year' && diffDays > 365) return false
    }

    return true
  })

  function handleChannelFilterChange(value: string) {
    setChannelFilter(value)
  }

  function handleTypeFilterChange(value: string) {
    setTypeFilter(value)
  }

  function handlePeriodFilterChange(value: string) {
    setPeriodFilter(value)
  }

  return {
    channelFilter,
    filteredCommunications,
    handleChannelFilterChange,
    handlePeriodFilterChange,
    handleTypeFilterChange,
    isErrorCommunications,
    isLoadingCommunications,
    periodFilter,
    typeFilter,
  }
}
