import { DocumentSpecificationsEmptyState } from './document-specifications-empty-state'
import { DocumentSpecificationsErrorState } from './document-specifications-error-state'
import { DocumentSpecificationsFilters } from './document-specifications-filters'
import { DocumentSpecificationsLoading } from './document-specifications-loading'
import { DocumentSpecificationsPagination } from './document-specifications-pagination'
import { DocumentSpecificationsTable } from './document-specifications-table'
import { useDocumentSpecificationsPage } from './use-document-specifications-page'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

export const DocumentSpecificationsPage = () => {
  const {
    searchParams,
    specifications,
    areas,
    topics,
    hasFilters,
    page,
    totalPages,
    update,
    updateArea,
    clear,
  } = useDocumentSpecificationsPage()

  return (
    <main className='mx-auto flex w-full flex-col gap-5'>
      <header className='flex flex-wrap items-start justify-between gap-3'>
        <div className='space-y-1.5'>
          <h1 className='font-serif text-[1.625rem] font-bold tracking-tight'>
            Modelos de documentos
          </h1>
          <p className='max-w-3xl text-xs leading-6 text-muted-foreground'>
            Gerencie o conteúdo, a aplicação e a disponibilidade dos documentos produzidos
            pelo escritório.
          </p>
        </div>
        <Anchor
          route='newDocumentSpecification'
          className='inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80'
        >
          Novo modelo
        </Anchor>
      </header>
      <DocumentSpecificationsFilters
        params={searchParams}
        areas={areas.data ?? []}
        topics={topics.data ?? []}
        areasLoading={areas.isLoading}
        topicsLoading={topics.isLoading}
        areasError={areas.isError}
        topicsError={topics.isError}
        onSearch={(search) => update({ search })}
        onArea={updateArea}
        onChange={update}
        onClear={clear}
      />
      {specifications.isLoading ? (
        <DocumentSpecificationsLoading />
      ) : specifications.isError ? (
        <DocumentSpecificationsErrorState onRetry={() => void specifications.refetch()} />
      ) : specifications.data?.items.length === 0 ? (
        <DocumentSpecificationsEmptyState filtered={hasFilters} onClear={clear} />
      ) : (
        <>
          <DocumentSpecificationsTable items={specifications.data?.items ?? []} />
          <DocumentSpecificationsPagination
            page={page}
            pageSize={searchParams.pageSize}
            total={specifications.data?.total ?? 0}
            totalPages={totalPages}
            onPage={(nextPage) => update({ page: nextPage })}
          />
        </>
      )}
    </main>
  )
}
