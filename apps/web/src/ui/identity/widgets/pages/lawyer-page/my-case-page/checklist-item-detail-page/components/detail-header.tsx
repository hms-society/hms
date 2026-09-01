import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { ChecklistItemDetailView } from '../use-checklist-item-detail-page'

export type ChecklistItemDetailHeaderProps = {
  checklistItem: CaseChecklistItem
  itemView: ChecklistItemDetailView
  onBackToCase: () => void
  onOpenValidationDesk: () => void
}

export const ChecklistItemDetailHeader = ({
  checklistItem,
  itemView,
  onBackToCase,
  onOpenValidationDesk,
}: ChecklistItemDetailHeaderProps) => (
  <section className='rounded-lg border border-border bg-card px-5 py-4 shadow-xs'>
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground'>
        <span>Início</span>
        <Icon name='chevron-right' className='size-3' />
        <span>Meus casos</span>
        <Icon name='chevron-right' className='size-3' />
        <button
          type='button'
          className='rounded-sm font-sans transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
          onClick={onBackToCase}
        >
          {itemView.caseLabel}
        </button>
        <Icon name='chevron-right' className='size-3' />
        <span className='font-semibold text-foreground'>{checklistItem.title}</span>
      </div>

      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='flex min-w-0 flex-col gap-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary' className='h-5 rounded-full px-2 text-[10px]'>
              Item {itemView.itemPositionLabel}
            </Badge>
            <Badge
              variant={itemView.statusVariant}
              className='h-5 rounded-full px-2 text-[10px]'
            >
              {itemView.pendingItems.length} pendência(s)
            </Badge>
            <Badge variant='outline' className='h-5 rounded-full px-2 text-[10px]'>
              {itemView.statusLabel}
            </Badge>
          </div>
          <h1 className='font-serif text-2xl font-semibold text-foreground'>
            {checklistItem.title}
          </h1>
          <p className='max-w-3xl text-xs text-muted-foreground'>
            {itemView.hasDocument
              ? `${itemView.documentLabel} vinculado ao item selecionado.`
              : 'Nenhum documento foi recebido para este item do checklist.'}
          </p>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            className='h-8 rounded-pill bg-accent px-3 text-[11px] text-accent-foreground'
            disabled={!itemView.hasDocument}
            onClick={onOpenValidationDesk}
          >
            <Icon name='check-circle-2' className='size-3' />
            Rever na Mesa de Validação
          </Button>
          <Button
            type='button'
            variant='brand'
            className='h-8 rounded-pill px-3 text-[11px]'
          >
            <Icon name='send' className='size-3' />
            Cobrança consolidada
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap items-center justify-end gap-3 border-t border-border pt-3'>
        <Button
          type='button'
          variant='ghost'
          size='xs'
          className='h-7 rounded-pill px-2 text-[10px] font-semibold text-primary'
        >
          <Icon name='alert-triangle' className='size-3' />
          Solicitar exceção
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='xs'
          className='h-7 rounded-pill px-2 text-[10px] font-semibold text-primary'
        >
          <Icon name='send' className='size-3' />
          Enviar documento manualmente
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='xs'
          className='h-7 rounded-pill px-2 text-[10px] font-semibold text-primary'
        >
          <Icon name='ellipsis' className='size-3' />
          Mais ações
        </Button>
      </div>
    </div>
  </section>
)
