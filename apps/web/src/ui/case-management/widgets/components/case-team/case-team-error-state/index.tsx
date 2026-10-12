import { Button } from '@/ui/shadcn/button'

export type CaseTeamErrorStateProps = {
  onRetry: () => void
}

export const CaseTeamErrorState = ({ onRetry }: CaseTeamErrorStateProps) => (
  <div className='rounded-xl border border-border bg-card p-6 text-center' role='alert'>
    <p className='text-sm text-destructive'>Não foi possível carregar a equipe.</p>
    <Button className='mt-3 rounded-full' variant='outline' onClick={onRetry}>
      Tentar novamente
    </Button>
  </div>
)
