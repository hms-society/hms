import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'

import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { ChecklistItemDetailView } from '../use-checklist-item-detail-page'

export type ChecklistItemSidePanelProps = {
  checklistItem: CaseChecklistItem
  itemView: ChecklistItemDetailView
}

export const ChecklistItemSidePanel = ({
  checklistItem,
  itemView,
}: ChecklistItemSidePanelProps) => (
  <aside className='flex flex-col gap-4'>
    <section className='rounded-lg border border-border bg-card p-4 shadow-xs'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 className='font-serif text-base font-semibold text-foreground'>
          Documento no item
        </h2>
        <Badge variant='secondary' className='h-5 rounded-full px-2 text-[10px]'>
          {itemView.hasDocument ? itemView.statusLabel : 'Sem versão válida'}
        </Badge>
      </div>
      <div className='flex flex-col items-center justify-center gap-3 rounded-md border border-border bg-muted/30 p-4 text-center'>
        <div className='flex size-10 items-center justify-center rounded-md bg-card text-muted-foreground shadow-xs'>
          <Icon
            name={itemView.hasDocument ? 'file-text' : 'file-minus'}
            className='size-5'
          />
        </div>
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='truncate text-sm font-semibold text-foreground'>
            {itemView.documentLabel}
          </span>
          <span className='text-xs text-muted-foreground'>
            {itemView.hasDocument
              ? 'Arquivo vinculado ao item selecionado.'
              : 'Nenhum arquivo recebido para este item.'}
          </span>
        </div>
      </div>
    </section>

    <section className='rounded-lg border border-border bg-card p-4 shadow-xs'>
      <h2 className='mb-3 font-serif text-base font-semibold text-foreground'>
        Tentativas anteriores
      </h2>
      <div className='rounded-md border border-border bg-muted/30 p-4 text-center'>
        <div className='mx-auto mb-2 flex size-8 items-center justify-center rounded-md bg-card text-muted-foreground shadow-xs'>
          <Icon name='history' className='size-4' />
        </div>
        <span className='block text-xs font-semibold text-foreground'>
          Nenhuma tentativa anterior registrada
        </span>
        <span className='mt-1 block text-[10px] text-muted-foreground'>
          O item possui apenas o documento atual ou ainda não recebeu arquivo.
        </span>
      </div>
    </section>

    <section className='rounded-lg border border-border bg-card p-4 shadow-xs'>
      <h2 className='mb-3 font-serif text-base font-semibold text-foreground'>
        Este item no checklist
      </h2>
      <dl className='grid grid-cols-[116px_1fr] gap-x-3 gap-y-2 text-xs'>
        <dt className='text-muted-foreground'>Posição</dt>
        <dd className='font-semibold text-foreground'>{itemView.itemPositionLabel}</dd>
        <dt className='text-muted-foreground'>Template</dt>
        <dd className='font-semibold text-foreground'>{checklistItem.templateItemKey}</dd>
        <dt className='text-muted-foreground'>Bloqueia gate</dt>
        <dd className='font-semibold text-foreground'>
          {checklistItem.isRequired ? 'Sim' : 'Não'}
        </dd>
        <dt className='text-muted-foreground'>Status</dt>
        <dd className='font-semibold text-foreground'>{itemView.statusLabel}</dd>
      </dl>
    </section>

    <section className='rounded-lg border border-border bg-card p-4 shadow-xs'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 className='font-serif text-base font-semibold text-foreground'>
          Auditoria completa
        </h2>
        <span className='text-[10px] font-semibold text-primary'>Eventos do item</span>
      </div>
      <p className='mb-3 text-xs text-muted-foreground'>
        Toda ação sobre este item fica registrada para acompanhar recebimento, validação e
        decisões posteriores.
      </p>
      <div className='grid grid-cols-3 gap-2'>
        {itemView.auditMetrics.map((metric) => (
          <div
            key={metric.label}
            className='rounded-md border border-border bg-muted/30 p-3'
          >
            <span className='block text-lg font-semibold text-foreground'>
              {metric.value}
            </span>
            <span className='block text-[10px] text-muted-foreground'>
              {metric.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  </aside>
)
