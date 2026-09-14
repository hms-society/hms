import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'
import { useMemo } from 'react'

import type { DynamicFormsTableProps } from './types'

export function useDynamicFormsTable(props: DynamicFormsTableProps) {
  const visibleItems = useMemo(() => props.items, [props.items])

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

  return { visibleItems, getTopicSummary, handlePageChange }
}
