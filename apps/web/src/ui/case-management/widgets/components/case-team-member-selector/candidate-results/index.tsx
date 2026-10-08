import { Button } from '@/ui/shadcn/button'
import { CandidateList } from '../candidate-list'
import type { CandidateListProps } from '../candidate-list'

export type CandidateResultsProps = CandidateListProps & {
  isError: boolean
  onRetry: () => void
}

export const CandidateResults = (props: CandidateResultsProps) =>
  props.isError ? (
    <div role='alert' className='space-y-2 text-sm text-destructive'>
      <p>Não foi possível buscar colaboradores.</p>
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='rounded-full'
        onClick={props.onRetry}
      >
        Tentar novamente
      </Button>
    </div>
  ) : (
    <CandidateList {...props} />
  )
