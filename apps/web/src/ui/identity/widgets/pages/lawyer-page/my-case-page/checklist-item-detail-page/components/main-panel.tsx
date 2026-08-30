import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type {
  ChecklistItemDetailView,
  ChecklistItemPending,
} from '../use-checklist-item-detail-page'

export type ChecklistItemMainPanelProps = {
  itemView: ChecklistItemDetailView
}

export const ChecklistItemMainPanel = ({
  itemView,
}: ChecklistItemMainPanelProps) => {
  const hasPendingItems = itemView.pendingItems.length > 0

  return (
    <main className='flex flex-col gap-4'>
      <section
        className={
          hasPendingItems
            ? 'rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 shadow-xs'
            : 'rounded-lg border border-border bg-card p-4 shadow-xs'
        }
      >
        <div className='flex items-start gap-3'>
          <div
            className={
              hasPendingItems
                ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-amber-700'
                : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
            }
          >
            <Icon
              name={hasPendingItems ? 'alert-triangle' : 'check-circle-2'}
              className='size-4'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <h2
              className={
                hasPendingItems
                  ? 'text-sm font-semibold text-amber-900'
                  : 'text-sm font-semibold text-foreground'
              }
            >
              {hasPendingItems ? 'Pendências do item' : 'Sem pendências ativas'}
            </h2>
            <p
              className={
                hasPendingItems
                  ? 'text-xs text-amber-900/80'
                  : 'text-xs text-muted-foreground'
              }
            >
              {hasPendingItems
                ? 'Revise os pontos abaixo antes de concluir a validação do item.'
                : 'Nenhuma pendência específica foi registrada para este item.'}
            </p>
          </div>
        </div>
      </section>

      <section className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-serif text-lg font-semibold text-foreground'>
            Pendências ativas
          </h2>
          <Badge
            variant={hasPendingItems ? 'destructive' : 'secondary'}
            className='h-5 rounded-full px-2 text-[10px]'
          >
            {itemView.pendingItems.length}
          </Badge>
        </div>

        {hasPendingItems ? (
          itemView.pendingItems.map((pendingItem, index) => (
            <PendingCard
              key={pendingItem.id}
              index={index + 1}
              pendingItem={pendingItem}
            />
          ))
        ) : (
          <div className='rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-xs'>
            Nenhuma pendência ativa vinculada ao item selecionado.
          </div>
        )}
      </section>
    </main>
  )
}

type PendingCardProps = {
  index: number
  pendingItem: ChecklistItemPending
}

const PendingCard = ({ index, pendingItem }: PendingCardProps) => (
  <article className='rounded-lg border border-border bg-card p-4 shadow-xs'>
    <div className='flex items-start gap-3'>
      <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-xs font-semibold text-destructive'>
        {index}
      </div>
      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='text-sm font-semibold text-foreground'>{pendingItem.title}</h3>
          <Badge variant='destructive' className='h-5 rounded-full px-2 text-[10px]'>
            Ativa
          </Badge>
        </div>
        <p className='rounded-md bg-muted/60 p-3 text-xs text-muted-foreground'>
          {pendingItem.description}
        </p>
      </div>
    </div>
  </article>
)
