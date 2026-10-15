import { Button } from '@/ui/shadcn/button'

export type CandidatePaginationProps = {
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

export const CandidatePagination = ({
  page,
  totalPages,
  onPrevious,
  onNext,
}: CandidatePaginationProps) => (
  <div className='flex items-center justify-between'>
    <Button
      type='button'
      variant='outline'
      size='sm'
      className='rounded-full'
      disabled={page <= 1}
      onClick={onPrevious}
    >
      Anterior
    </Button>
    <span className='text-xs text-muted-foreground'>
      Página {page} de {totalPages}
    </span>
    <Button
      type='button'
      variant='outline'
      size='sm'
      className='rounded-full'
      disabled={page >= totalPages}
      onClick={onNext}
    >
      Próxima
    </Button>
  </div>
)
