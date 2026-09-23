import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'

type DossierGateBannerProps = {
  approved: boolean
}

export function DossierGateBanner({ approved }: DossierGateBannerProps) {
  if (!approved) {
    return (
      <section className='flex flex-col gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <Icon name='lock' className='mt-0.5 size-4 text-muted-foreground' />
          <div>
            <h2 className='text-sm font-semibold text-foreground'>
              Produção jurídica bloqueada
            </h2>
            <p className='text-xs text-muted-foreground'>
              A elaboração de peças será liberada após a aprovação do dossiê documental.
            </p>
          </div>
        </div>
        <Button variant='outline' size='xs' disabled>
          Abrir dossiê
        </Button>
      </section>
    )
  }

  return (
    <section className='flex flex-col gap-3 rounded-lg border border-primary/20 bg-highlight px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-start gap-3'>
        <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-primary'>
          <Icon name='file-text' className='size-4' />
        </div>
        <div>
          <h2 className='text-sm font-semibold text-primary'>Dossiê aprovado em 14/07</h2>
          <p className='text-xs text-primary/75'>
            7 documentos validados · aprovado por Dr. Ricardo Mendes · toda peça produzida
            referencia esta versão do dossiê.
          </p>
        </div>
      </div>
      <Button
        variant='outline'
        size='xs'
        className='rounded-full border-primary/40 text-primary'
      >
        <Icon name='eye' className='size-3' />
        Abrir dossiê
      </Button>
    </section>
  )
}
