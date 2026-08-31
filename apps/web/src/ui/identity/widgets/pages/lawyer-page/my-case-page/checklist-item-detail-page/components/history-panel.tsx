import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { ChecklistItemDetailView } from '../use-checklist-item-detail-page'

export type ChecklistItemHistoryPanelProps = {
  itemView: ChecklistItemDetailView
}

export const ChecklistItemHistoryPanel = ({
  itemView,
}: ChecklistItemHistoryPanelProps) => (
  <section className='rounded-lg border border-border bg-card p-4 shadow-xs'>
    <div className='mb-4 flex items-center justify-between gap-3'>
      <div>
        <h2 className='font-serif text-lg font-semibold text-foreground'>
          Histórico do item
        </h2>
        <p className='text-xs text-muted-foreground'>
          Eventos conhecidos deste item em ordem cronológica.
        </p>
      </div>
      <Badge variant='outline' className='h-7 rounded-full px-3 text-[10px]'>
        Todos os eventos
      </Badge>
    </div>

    <div className='relative flex flex-col gap-4 before:absolute before:inset-y-2 before:left-3 before:w-px before:bg-border'>
      {itemView.historyEvents.map((event) => (
        <div key={event.id} className='relative z-10 flex items-start gap-3'>
          <div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background'>
            <Icon name={event.icon} className='size-3 text-muted-foreground' />
          </div>
          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <span className='text-sm font-semibold text-foreground'>{event.title}</span>
              {event.badge && (
                <Badge variant='secondary' className='h-5 rounded-full px-2 text-[10px]'>
                  {event.badge}
                </Badge>
              )}
            </div>
            <span className='text-xs text-muted-foreground'>{event.description}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
)
