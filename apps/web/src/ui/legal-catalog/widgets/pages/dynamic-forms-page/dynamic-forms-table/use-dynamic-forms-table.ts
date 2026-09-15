import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'
import { useMemo } from 'react'

import type { DynamicFormsTableProps } from './types'

export function useDynamicFormsTable(props: DynamicFormsTableProps) {
  const visibleItems = useMemo(() => props.items, [props.items])
  const pageNumbers = useMemo(() => {
    if (props.pageCount <= 0) return []

    return props.pageCount <= 5
      ? Array.from({ length: props.pageCount }, (_, index) => index + 1)
      : Array.from({ length: 5 }, (_, index) => {
          if (props.page <= 3) return index + 1
          if (props.page >= props.pageCount - 2) return props.pageCount - 4 + index
          return props.page - 2 + index
        })
  }, [props.page, props.pageCount])
  const showLeadingEllipsis = props.pageCount > 5 && props.page > 3
  const showTrailingEllipsis = props.pageCount > 5 && props.page < props.pageCount - 2

  function handlePageChange(page: number) {
    if (page !== props.page && page >= 1 && page <= props.pageCount) {
      props.onPageChange(page)
    }
  }

  function getTopicSummary(item: DynamicFormListItem) {
    const [principal, ...remainingTopics] = [...item.legalTopics].sort(
      (first, second) => first.position - second.position,
    )
    if (!principal) return '—'
    return remainingTopics.length > 0
      ? `${principal.name} +${remainingTopics.length}`
      : principal.name
  }

  return {
    visibleItems,
    pageNumbers,
    showLeadingEllipsis,
    showTrailingEllipsis,
    getTopicSummary,
    handlePageChange,
  }
}
