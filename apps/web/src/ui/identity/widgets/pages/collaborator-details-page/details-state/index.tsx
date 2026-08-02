import { Button } from '@/ui/shadcn/button'

export type DetailsStateProps = {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export const DetailsState = ({ message, actionLabel, onAction }: DetailsStateProps) => {
  return (
    <section className='flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card px-6 text-center'>
      <p className='text-sm text-muted-foreground'>{message}</p>
      {actionLabel && onAction && (
        <Button variant='outline' onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </section>
  )
}
