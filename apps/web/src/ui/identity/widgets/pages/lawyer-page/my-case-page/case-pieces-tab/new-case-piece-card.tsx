import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'

type NewCasePieceCardProps = {
  disabled?: boolean
  onOpen?: () => void
}

export function NewCasePieceCard({ disabled = false, onOpen }: NewCasePieceCardProps) {
  return (
    <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-start gap-3'>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground'>
          <Icon name='plus' className='size-4' />
        </div>
        <div>
          <h2 className='text-sm font-semibold text-foreground'>
            Nova peça a partir de modelo
          </h2>
          <p className='text-xs text-muted-foreground'>
            Escolha um modelo de tipo de serviço e a IA prepara a minuta preenchida com os
            dados do dossiê.
          </p>
        </div>
      </div>
      <Button
        variant='outline'
        size='xs'
        className='rounded-full'
        disabled={disabled}
        onClick={onOpen}
      >
        <Icon name='plus' className='size-3' /> Nova peça
      </Button>
    </section>
  )
}
