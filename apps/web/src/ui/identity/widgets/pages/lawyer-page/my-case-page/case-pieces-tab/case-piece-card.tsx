import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'

import type { CasePiece } from './types'

export type CasePieceCardProps = {
  piece: CasePiece
  onOpenReview?: () => void
  onOpenEditor?: () => void
}

export function CasePieceCard({
  piece,
  onOpenReview,
  onOpenEditor,
}: CasePieceCardProps) {
  return (
    <article className='rounded-lg border border-border bg-card p-4 shadow-xs'>
      <header className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary'>
            <Icon name='file-text' className='size-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-sm font-semibold text-foreground'>{piece.title}</h2>
              <Badge variant='attention' className='h-5 rounded-full px-2 text-[11px]'>
                {piece.status}
              </Badge>
            </div>
            <p className='mt-1 text-xs text-muted-foreground'>
              Modelo: {piece.template} · Elaborada por {piece.author} · Revisor:{' '}
              {piece.reviewer} · Atualizada hoje, {piece.updatedAt}
            </p>
          </div>
        </div>
        <Badge variant='secondary' className='w-fit rounded-full text-[11px]'>
          <Icon name='sparkles' className='size-3' /> Minuta inicial gerada com IA
        </Badge>
      </header>

      <div className='mt-4 rounded-md border border-border bg-muted/30 p-3'>
        <div className='mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
          <span>Versões</span>
          <Button variant='link' size='xs' className='h-auto p-0 text-primary'>
            Comparar versões
          </Button>
        </div>
        <div className='divide-y divide-border'>
          {piece.versions.map((version, index) => (
            <div
              key={version.id}
              className='flex items-center gap-3 py-2 first:pt-0 last:pb-0'
            >
              <Badge
                variant={index === 0 ? 'success' : 'secondary'}
                className='h-6 min-w-8 justify-center rounded-md px-1.5 text-[11px]'
              >
                {version.label}
              </Badge>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-xs font-semibold text-foreground'>
                  {version.title}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  {version.author} · {version.timestamp}
                  {version.meta ? ` · ${version.meta}` : ''}
                </p>
              </div>
              <div className='flex shrink-0 gap-1'>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  aria-label={`Visualizar ${version.label}`}
                >
                  <Icon name='eye' className='size-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon-xs'
                  aria-label={`Baixar ${version.label}`}
                >
                  <Icon name='download' className='size-3.5' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap gap-2'>
          <Button size='xs' className='rounded-full' onClick={onOpenReview}>
            <Icon name='eye' className='size-3' /> Abrir revisão técnica
          </Button>
          <Button
            variant='outline'
            size='xs'
            className='rounded-full'
            onClick={onOpenEditor}
          >
            <Icon name='pencil' className='size-3' /> Abrir no editor
          </Button>
        </div>
        <span className='text-right text-[11px] text-muted-foreground'>
          {piece.status === 'Aprovada' ? 'Pronta para protocolo' : 'Protocolo bloqueado até aprovação da revisão'}
        </span>
      </footer>
    </article>
  )
}
