import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPages,
  PaginationPrevious,
} from '@/ui/shadcn/pagination'

export type DocumentSpecificationsPaginationProps = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPage: (page: number) => void
}

export const DocumentSpecificationsPagination = ({
  page,
  pageSize,
  total,
  totalPages,
  onPage,
}: DocumentSpecificationsPaginationProps) => {
  if (total === 0) return null

  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, total)

  return (
    <Pagination
      aria-label='Paginação de modelos de documentos'
      className='justify-between gap-4 rounded-lg border border-border bg-card px-5 py-3'
    >
      <span className='text-xs text-muted-foreground'>
        Exibindo {startItem}–{endItem} de {total}
      </span>
      <PaginationContent className='gap-1'>
        <PaginationItem>
          <PaginationPrevious
            href='#'
            aria-label='Página anterior'
            disabled={page <= 1}
            onClick={(event) => {
              event.preventDefault()
              onPage(page - 1)
            }}
          />
        </PaginationItem>
        <PaginationPages page={page} totalPages={totalPages} onPage={onPage} />
        <PaginationItem>
          <PaginationNext
            href='#'
            aria-label='Próxima página'
            disabled={page >= totalPages}
            onClick={(event) => {
              event.preventDefault()
              onPage(page + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
