import { Button } from '@/ui/shadcn/button'

export function FormalizationLoadingPanel() {
  return (
    <section className='rounded-xl border border-border bg-card p-6' aria-busy='true'>
      Carregando formalização…
    </section>
  )
}

export function FormalizationStatePanel({
  title,
  description,
  onRetry,
}: {
  title: string
  description: string
  onRetry?: () => void
}) {
  return (
    <section
      className='flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center'
      role='alert'
    >
      <h1 className='font-serif text-2xl text-brand'>{title}</h1>
      <p className='max-w-md text-sm text-muted-foreground'>{description}</p>
      {onRetry && (
        <Button variant='outline' onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </section>
  )
}
