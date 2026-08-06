import type { DocumentSpecificationListQuery } from '@hms/core/document-production/domain/structures'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'
import {
  DOCUMENT_SPECIFICATIONS_SEARCH_PARAMS,
  type DocumentSpecificationsSearchParams,
} from './document-specifications-page-search'
import { useDocumentSpecificationsQuery } from './use-document-specifications-query'
import { useDocumentCatalogQuery } from './use-document-catalog-query'
import { useDocumentTopicsQuery } from './use-document-topics-query'

function toQuery(
  params: DocumentSpecificationsSearchParams,
): DocumentSpecificationListQuery {
  return {
    search: params.search.trim() || undefined,
    legalAreaId: params.legalAreaId ?? undefined,
    legalTopicId: params.legalTopicId ?? undefined,
    moment: params.moment ?? undefined,
    status: params.status ?? undefined,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export function useDocumentSpecificationsPage() {
  const [searchParams, setSearchParams] = useQueryStates(
    DOCUMENT_SPECIFICATIONS_SEARCH_PARAMS,
    { history: 'push' },
  )
  const query = useMemo(() => toQuery(searchParams), [searchParams])
  const specifications = useDocumentSpecificationsQuery(query)
  const { areas } = useDocumentCatalogQuery()
  const topics = useDocumentTopicsQuery(searchParams.legalAreaId)

  function update(patch: Partial<DocumentSpecificationsSearchParams>) {
    const filterChanged = Object.keys(patch).some(
      (key) => !['page', 'pageSize'].includes(key),
    )
    return setSearchParams({
      ...patch,
      ...(filterChanged
        ? { page: 1, legalTopicId: patch.legalAreaId === null ? null : undefined }
        : {}),
    })
  }

  function updateArea(value: string | null) {
    return setSearchParams({ legalAreaId: value, legalTopicId: null, page: 1 })
  }

  function clear() {
    return setSearchParams({
      search: '',
      legalAreaId: null,
      legalTopicId: null,
      moment: null,
      status: null,
      page: 1,
    })
  }

  const hasFilters = Boolean(
    searchParams.search ||
      searchParams.legalAreaId ||
      searchParams.legalTopicId ||
      searchParams.moment ||
      searchParams.status,
  )
  return {
    searchParams,
    query,
    page: specifications.data?.page ?? searchParams.page,
    totalPages: specifications.data?.totalPages ?? 0,
    hasFilters,
    specifications,
    areas,
    topics,
    update,
    updateArea,
    clear,
  }
}

export type DocumentSpecificationsPageController = ReturnType<
  typeof useDocumentSpecificationsPage
>
