import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

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
  if (totalPages <= 1) return null
  return (
    <nav
      aria-label='Paginação de modelos de documentos'
      className='flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-3'
    >
      <span className='text-xs text-muted-foreground'>
        Exibindo {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}{' '}
        modelos
      </span>
      <div className='flex gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          aria-label='Página anterior'
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Icon name='chevron-left' />
          Anterior
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          aria-label='Próxima página'
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Próxima
          <Icon name='chevron-right' />
        </Button>
      </div>
    </nav>
  )
}
