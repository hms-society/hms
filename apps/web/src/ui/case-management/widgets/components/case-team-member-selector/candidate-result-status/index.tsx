export type CandidateResultStatusProps = {
  total: number
  isLoading: boolean
  onClear: () => void
}

export const CandidateResultStatus = ({
  total,
  isLoading,
  onClear,
}: CandidateResultStatusProps) => (
  <div
    className='flex items-center justify-between gap-3 text-xs text-muted-foreground'
    aria-live='polite'
  >
    <span>{isLoading ? 'Buscando…' : `${total} colaboradores encontrados`}</span>
    <button
      type='button'
      className='rounded px-2 py-1 text-foreground underline underline-offset-4'
      onClick={onClear}
    >
      Limpar
    </button>
  </div>
)
