import { useEffect, useState } from 'react'

import { useCalendarFilterOptions } from '@/ui/scheduling/hooks/use-calendar-filter-options'

export function useClientFilterDialog(
  open: boolean,
  selectedClientId: string | undefined,
  onApply: (clientId?: string) => void,
) {
  const [search, setSearch] = useState('')
  const [draftClientId, setDraftClientId] = useState(selectedClientId)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const optionsQuery = useCalendarFilterOptions('client', debouncedSearch, open)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (open) {
      setDraftClientId(selectedClientId)
      setSearch('')
    }
  }, [open, selectedClientId])

  return {
    search,
    setSearch,
    draftClientId,
    setDraftClientId,
    options: optionsQuery.data?.items ?? [],
    isLoading: optionsQuery.isPending || optionsQuery.isFetchingNextPage,
    isError: optionsQuery.isError,
    hasNextPage: optionsQuery.hasNextPage,
    isScanLimitReached: optionsQuery.scanLimitReached,
    loadMore() {
      return optionsQuery.fetchNextPage()
    },
    apply() {
      onApply(draftClientId)
    },
    clearSearch() {
      setSearch('')
    },
  }
}
