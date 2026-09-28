import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { unwrapSchedulingResponse } from '@/rest/services/scheduling-service'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCalendarFilterOptions(
  kind: 'client' | 'lawyer',
  search = '',
  enabled = true,
) {
  const { schedulingService } = useRestContext()
  const query = useInfiniteQuery({
    queryKey: ['scheduling', 'filter-options', kind, search],
    queryFn: async function fetchCalendarFilterOptions({ pageParam }) {
      const response = await schedulingService.listCalendarFilterOptions(
        kind,
        search.trim() || undefined,
        pageParam,
      )
      return unwrapSchedulingResponse(response)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: MAX_FILTER_OPTION_PAGES,
    enabled,
  })
  const pages = query.data?.pages ?? []
  const data = useMemo(
    () => ({
      items: pages.flatMap((page) => page.items),
      nextCursor: pages.at(-1)?.nextCursor,
    }),
    [pages],
  )
  const isScanning =
    query.isPending ||
    query.isFetchingNextPage ||
    (enabled && data.items.length === 0 && Boolean(query.hasNextPage))

  useEffect(() => {
    if (
      !enabled ||
      data.items.length > 0 ||
      !query.hasNextPage ||
      query.isFetchingNextPage ||
      pages.length >= MAX_FILTER_OPTION_PAGES
    ) {
      return
    }

    void query.fetchNextPage()
  }, [data.items.length, enabled, pages.length, query])

  return {
    ...query,
    data,
    isPending: isScanning,
    isScanning,
    scanLimitReached:
      pages.length >= MAX_FILTER_OPTION_PAGES && Boolean(query.hasNextPage),
  }
}

export const MAX_FILTER_OPTION_PAGES = 5
